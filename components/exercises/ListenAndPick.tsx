import { Audio, AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { Exercise, Item } from "../../data/data";
import { items } from "../../lib/items-store";
import { useTranslation } from "../../lib/localization";
import { DuoButton } from "../DuoButton";
import { Body, Title } from "../Typography";
import ImageWithLoader from "../common/ImageWithLoader";

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

interface ListenAndPickProps {
  exercise: Exercise;
  onComplete: (isCorrect?: boolean) => void;
}

export default React.memo(function ListenAndPick({
  exercise,
  onComplete,
}: ListenAndPickProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Guard to prevent multiple onComplete calls
  const isCompletedRef = useRef(false);

  // Ref to track if component is unmounting to avoid false errors
  const isUnmountingRef = useRef(false);

  // Get answer item
  const answerItem = items.find((i) => i.id === exercise.answerId);

  // Create stable exercise identifier
  const exerciseId = `${exercise.stageId}-${exercise.order}`;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (sound) {
        // Remove status update listener before cleanup to prevent false errors
        sound.setOnPlaybackStatusUpdate(null);
        // Cleanup sound on unmount - suppress any errors
        sound.unloadAsync().catch(() => {
          // Silently ignore cleanup errors - they're expected during unmount
        });
      }
    };
  }, [sound]);

  // Shuffle items when exercise changes
  useEffect(() => {
    // Get items inside effect to avoid dependency issues
    // Map exercise.optionIds to items from items-store
    // The items-store is populated by task.tsx from API data via mapPopulatedExerciseToExercise
    const currentExerciseItems = exercise.optionIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined);

    // Verify we found all options
    if (currentExerciseItems.length !== exercise.optionIds.length) {
      const missingIds = exercise.optionIds.filter(
        (id) => !items.find((item) => item.id === id)
      );
      console.warn(
        `ListenAndPick: Some option IDs not found in items-store. Missing IDs: ${missingIds.join(
          ", "
        )}`
      );
    }

    // Reset state
    setSelectedId(null);
    setIsCorrect(null);
    isCompletedRef.current = false;

    // Only shuffle if we have items
    if (currentExerciseItems.length === 0) {
      setShuffledItems([]);
      return;
    }

    // Shuffle items - ensure different order each time
    let shuffled = shuffleArray(currentExerciseItems);
    // Make sure it's actually shuffled (not same order)
    let attempts = 0;
    const maxAttempts = 10;
    while (
      attempts < maxAttempts &&
      shuffled.every(
        (item, index) => item.id === currentExerciseItems[index]?.id
      )
    ) {
      shuffled = shuffleArray(currentExerciseItems);
      attempts++;
    }

    setShuffledItems(shuffled);
  }, [exercise.optionIds]);

  const playAnswerAudio = async () => {
    const audioUrl = answerItem?.audioUrl;

    if (!audioUrl || audioUrl.trim() === "") {
      Alert.alert(
        t('exercise.audioNotAvailable'),
        t('exercise.audioFileNotAvailable')
      );
      return;
    }

    // Validate URL format
    if (
      !audioUrl.startsWith("http://") &&
      !audioUrl.startsWith("https://") &&
      !audioUrl.startsWith("file://")
    ) {
      Alert.alert(t('exercise.invalidUrl'), t('exercise.invalidUrlMessage'));
      return;
    }

    try {
      // Check permissions before playing
      if (Platform.OS !== "web") {
        const { status } = await Audio.getPermissionsAsync();

        if (status !== "granted") {
          const { status: newStatus } = await Audio.requestPermissionsAsync();

          if (newStatus !== "granted") {
            Alert.alert(
              t('exercise.permissionRequired'),
              t('exercise.audioPlaybackPermission')
            );
            return;
          }
        }
      }

      // Stop and unload active sound if any
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          // Ignore errors during cleanup
        }
        setSound(null);
      }

      setIsPlaying(true);

      // Set audio mode for playback - ensure it plays even in silent mode
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          // Android specific: ensure audio plays through speaker/headphones
          shouldDuckAndroid: false, // Don't duck other audio
        });
      } catch (audioModeError) {
        // Continue anyway - might still work
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);

      // Get initial status
      const status = await newSound.getStatusAsync();

      if (status.isLoaded) {
        if (status.shouldPlay && !status.isPlaying) {
          await newSound.playAsync();
        } else if (!status.shouldPlay) {
          await newSound.playAsync();
        }

        // Check status again after a brief delay to confirm playback
        setTimeout(async () => {
          try {
            const updatedStatus = await newSound.getStatusAsync();
            if (updatedStatus.isLoaded) {
              if (
                !updatedStatus.isPlaying &&
                updatedStatus.positionMillis === 0
              ) {
                Alert.alert(
                  t('exercise.audioNotPlaying'),
                  t('exercise.audioNotPlayingMessage')
                );
              }
            }
          } catch (e) {
            // Ignore status check errors
          }
        }, 500);
      }

      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        // Don't process status updates if component is unmounting
        if (isUnmountingRef.current) return;

        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
    } catch (error) {
      setIsPlaying(false);
      setSound(null);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      Alert.alert(
        t('exercise.audioPlayError'),
        t('exercise.audioPlayErrorMessage', { error: errorMessage })
      );
    }
  };

  const handleSelect = useCallback(
    (itemId: number) => {
      // If already completed, do nothing
      if (isCorrect === true || isCompletedRef.current) return;

      setSelectedId(itemId);

      if (itemId === exercise.answerId) {
        // Mark as completed immediately to prevent multiple calls
        isCompletedRef.current = true;
        setIsCorrect(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Call onComplete with isCorrect = true (default)
        onComplete(true);
      } else {
        setIsCorrect(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Call onComplete with isCorrect = false (will show confetti celebration)
        onComplete(false);
      }
    },
    [isCorrect, exercise.answerId, onComplete]
  );

  // Validation: Check if answerItem exists and has required properties
  if (!answerItem) {
    return (
      <View style={styles.container}>
        <Body style={styles.errorText}>
          Answer item not found (ID: {exercise.answerId})
        </Body>
      </View>
    );
  }

  if (!answerItem.word) {
    return (
      <View style={styles.container}>
        <Body style={styles.errorText}>
          Answer item is missing the word property
        </Body>
      </View>
    );
  }

  if (!answerItem.audioUrl || answerItem.audioUrl.trim() === "") {
    return (
      <View style={styles.container}>
        <Body style={styles.errorText}>Answer item is missing audio URL</Body>
      </View>
    );
  }

  // Validation: Check if all options have imageUrl
  const optionsWithoutImages = shuffledItems.filter(
    (item) => !item.imageUrl || item.imageUrl.trim() === ""
  );
  if (optionsWithoutImages.length > 0) {
    return (
      <View style={styles.container}>
        <Body style={styles.errorText}>
          Some options are missing images (IDs:{" "}
          {optionsWithoutImages.map((i) => i.id).join(", ")})
        </Body>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title size="large" style={styles.title}>
        {t('exercise.listenAndPick')}
      </Title>
      <Body size="large" style={styles.question}>
        {exercise.question}
      </Body>

      {/* Answer Item Card with Audio */}
      <View style={styles.answerCard}>
        <Title size="xlarge" style={styles.answerWord}>
          {answerItem.word}
        </Title>
        <DuoButton
          title=""
          onPress={playAnswerAudio}
          color="blue"
          size="medium"
          customSize={60}
          style={styles.audioButton}
          icon="volume-high"
          shape="circle"
          iconSize={28}
        />
      </View>

      {/* Option Cards Grid */}
      <View style={styles.content}>
        <View style={styles.grid}>
          {shuffledItems.map((item) => {
            const isSelected = selectedId === item.id;

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.imageCard,
                  isSelected && isCorrect !== null && styles.imageCardCorrect,
                ]}
              >
                <TouchableOpacity
                  style={styles.touchable}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.7}
                  disabled={isCorrect === true}
                >
                  {item.imageUrl && (
                    <ImageWithLoader
                      source={{ uri: item.imageUrl }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    color: "#FF1493",
    textAlign: "center",
    marginBottom: 8,
    marginTop: -20,
  },
  question: {
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: "80%",
  },
  answerCard: {
    width: "90%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#E8E8E8",
  },
  answerWord: {
    fontFamily: "FredokaOne",
    fontSize: 42,
    color: "#4A4A4A",
    flex: 1,
  },
  audioButton: {
    // Width/Height handled by customSize prop
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 24,
    width: "100%",
    maxWidth: 380,
  },
  imageCard: {
    width: "45%", // Responsive width
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  touchable: {
    flex: 1,
  },
  imageCardSelected: {
    borderColor: "#4A90E2",
    borderWidth: 6,
    transform: [{ scale: 1.08 }],
  },
  imageCardCorrect: {
    borderColor: "#58CC02", // Match DuoButton green
    borderWidth: 6,
    backgroundColor: "#E6FFFA",
    shadowColor: "#58CC02",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  imageCardWrong: {
    borderColor: "#FF4B4B", // Match DuoButton red scheme
    borderWidth: 6,
    backgroundColor: "#FFF0F0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  errorText: {
    fontSize: 16,
    color: "#FF4B4B",
    textAlign: "center",
    padding: 20,
  },
});


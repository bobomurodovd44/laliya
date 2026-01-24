import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { Exercise, Item } from "../../data/data";
import { useAudioCache } from "../../hooks/useAudioCache";
import { items } from "../../lib/items-store";
import { useTranslation } from "../../lib/localization";
import ImageWithLoader from "../common/ImageWithLoader";
import { DuoButton } from "../DuoButton";
import TryAgainModal from "../TryAgainModal";
import { Body, Title } from "../Typography";

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

interface OddOneOutProps {
  exercise: Exercise;
  onComplete: (isCorrect?: boolean, tryCount?: number) => void;
}

export default React.memo(function OddOneOut({ exercise, onComplete }: OddOneOutProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);

  // Guard to prevent multiple onComplete calls
  const isCompletedRef = useRef(false);

  // Ref to track if component is unmounting to avoid false errors
  const isUnmountingRef = useRef(false);


  const [showTryAgainModal, setShowTryAgainModal] = useState(false);
  const [tryCount, setTryCount] = useState(0);
  const { play: playAudio, isPlaying } = useAudioCache();


  // Create stable exercise identifier
  const exerciseId = `${exercise.stageId}-${exercise.order}`;

  // Shuffle items when exercise changes
  useEffect(() => {
    // Get items inside effect to avoid dependency issues
    const currentExerciseItems = exercise.optionIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined);

    // Reset state
    setSelectedId(null);
    setIsCorrect(null);
    setTryCount(0);
    isCompletedRef.current = false;

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

  // No-op for cleanup

  const playQuestionAudio = async () => {
    if (!exercise.questionAudioUrl || isPlaying) return;
    await playAudio(exercise.questionAudioUrl);
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

        // Call onComplete with isCorrect = true and the current tryCount
        onComplete(true, tryCount);
      } else {
        setIsCorrect(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Increment tryCount on wrong answer
        setTryCount(prev => {
          const next = prev + 1;
          return next;
        });

        // Show try again modal instead of completing the exercise
        setShowTryAgainModal(true);
      }
    },
    [isCorrect, exercise.answerId, onComplete, tryCount]
  );

  return (
    <View style={styles.container}>
      <Title size="small" style={styles.title}>
        {t("exercise.oddOneOut")}
      </Title>
      <View style={styles.questionContainer}>
        <Body size="large" style={styles.question}>
          {exercise.question}
        </Body>
        {exercise.questionAudioUrl && (
          <DuoButton
            title=""
            onPress={playQuestionAudio}
            color="blue"
            size="medium"
            customSize={54}
            style={styles.audioButton}
            icon="play"
            shape="circle"
            iconSize={26}
          />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.grid}>
          {shuffledItems.map((item) => {
            const isSelected = selectedId === item.id;

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.imageCard,
                  isSelected && isCorrect === true && styles.imageCardCorrect,
                  isSelected && isCorrect === false && styles.imageCardWrong,
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
      {/* Try Again Modal */}
      <TryAgainModal
        visible={showTryAgainModal}
        onClose={() => {
          setShowTryAgainModal(false);
        }}
      />
    </View>
);
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  title: {
    color: "#FF1493",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 0,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 12,
    width: "100%",
  },
  question: {
    color: "#666",
    textAlign: "center",
    maxWidth: "80%",
    fontSize: 28,
  },
  audioButton: {
    // Styling for audio button
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
    maxWidth: 380, // Reduced from 500 per user feedback
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
    borderColor: "#FFC107", // Soft yellow
    borderWidth: 6,
    backgroundColor: "#FFF9C4", // Light yellow background
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

import { Audio, AVPlaybackStatus } from "expo-av";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { Exercise } from "../../data/data";
import { audioCache } from "../../lib/audio-cache";
import { items } from "../../lib/items-store";
import { useTranslation } from "../../lib/localization";
import { DuoButton } from "../DuoButton";
import { Body, Title } from "../Typography";

interface LookAndSayProps {
  exercise: Exercise;
  onComplete: () => void;
  onRecordingComplete?: (recordedUri: string | null) => void;
}

// Ring Component for Ripple Effect
const Ring = ({
  index,
  isRecording,
}: {
  index: number;
  isRecording: boolean;
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withSequence(
          withDelay(
            index * 400, // Stagger based on index
            withTiming(1.6, { duration: 2000, easing: Easing.out(Easing.ease) }) // Slightly larger and slower
          ),
          withTiming(1, { duration: 0 }) // Reset
        ),
        -1,
        false
      );

      opacity.value = withRepeat(
        withSequence(
          withDelay(
            index * 400,
            withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) })
          ),
          withTiming(1, { duration: 0 }) // Reset
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0);
    }
  }, [isRecording, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        { backgroundColor: "rgba(255, 140, 0, 0.5)", zIndex: -index },
        animatedStyle,
      ]}
    />
  );
};

export default React.memo(function LookAndSay({
  exercise,
  onComplete,
  onRecordingComplete,
}: LookAndSayProps) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isQuestionPlaying, setIsQuestionPlaying] = useState(false);

  const questionSoundRef = useRef<Audio.Sound | null>(null);
  const recordedSoundRef = useRef<Audio.Sound | null>(null);
  const audioOperationRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_RECORDING_TIME = 15;

  const itemId =
    exercise.answerId ??
    (exercise.optionIds.length > 0 ? exercise.optionIds[0] : undefined);
  const item = itemId ? items.find((i) => i.id === itemId) : undefined;

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (questionSoundRef.current) {
        questionSoundRef.current.setOnPlaybackStatusUpdate(null);
        questionSoundRef.current.unloadAsync().catch(() => {});
        questionSoundRef.current = null;
      }
      if (recordedSoundRef.current) {
        recordedSoundRef.current.setOnPlaybackStatusUpdate(null);
        recordedSoundRef.current.unloadAsync().catch(() => {});
        recordedSoundRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (questionSoundRef.current) {
      questionSoundRef.current.setOnPlaybackStatusUpdate(null);
      questionSoundRef.current.unloadAsync().catch(() => {});
      questionSoundRef.current = null;
      setIsQuestionPlaying(false);
    }
  }, [exercise.id]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    }).catch(() => {});
  }, []);

  const startRecording = async () => {
    if (audioOperationRef.current) return;
    audioOperationRef.current = true;

    try {
      if (Platform.OS !== "web") {
        const { status: currentStatus } = await Audio.getPermissionsAsync();

        if (currentStatus !== "granted") {
          const { status } = await Audio.requestPermissionsAsync();

          if (status !== "granted") {
            Alert.alert(
              t('exercise.permissionRequired'),
              t('exercise.microphonePermissionRequired')
            );
            audioOperationRef.current = false;
            return;
          }
        }
      }

      if (questionSoundRef.current) {
        try {
          await questionSoundRef.current.stopAsync();
        } catch (e) {}
        questionSoundRef.current = null;
        setIsQuestionPlaying(false);
      }

      if (recordedSoundRef.current) {
        try {
          await recordedSoundRef.current.stopAsync();
        } catch (e) {}
        recordedSoundRef.current = null;
        setIsPlayingRecording(false);
      }

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (audioModeError) {
        Alert.alert(
          t('exercise.audioModeError'),
          t('exercise.audioModeErrorMessage')
        );
        audioOperationRef.current = false;
        return;
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      setIsRecording(false);
      setRecording(null);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      Alert.alert(
        t('exercise.recordingFailed'),
        t('exercise.recordingFailedMessage', { error: errorMessage })
      );
      console.error("Failed to start recording:", err);
    } finally {
      audioOperationRef.current = false;
    }
  };

  const stopRecording = useCallback(async () => {
    setIsRecording(false);

    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri);
    setRecording(null);
    setRecordingTime(0); // Reset timer

    // Notify parent component about recorded URI
    if (onRecordingComplete) {
      onRecordingComplete(uri);
    }

    onComplete();
  }, [recording, onRecordingComplete, onComplete]);

  // Auto-stop recording when time limit is reached
  useEffect(() => {
    if (isRecording && recordingTime >= MAX_RECORDING_TIME) {
      stopRecording();
    }
  }, [recordingTime, isRecording, stopRecording]);

  const playItemAudio = async () => {
    if (audioOperationRef.current) return;
    audioOperationRef.current = true;

    try {
      const audioUrl = exercise.questionAudioUrl || item?.audioUrl;

      if (!audioUrl || audioUrl.trim() === "") {
        audioOperationRef.current = false;
        Alert.alert(
          t('exercise.audioNotAvailable'),
          t('exercise.audioFileNotAvailable')
        );
        return;
      }

      const localUri = await audioCache.getLocalUri(audioUrl);

      if (!questionSoundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: localUri },
          { shouldPlay: true }
        );
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (isUnmountingRef.current) return;
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsQuestionPlaying(false);
            }
          }
        });
        
        questionSoundRef.current = sound;
        setIsQuestionPlaying(true);
        audioOperationRef.current = false;
        return;
      }

      const sound = questionSoundRef.current;
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: localUri },
          { shouldPlay: true }
        );
        
        newSound.setOnPlaybackStatusUpdate((st) => {
          if (isUnmountingRef.current) return;
          if (st.isLoaded && st.didJustFinish) {
            setIsQuestionPlaying(false);
          }
        });
        
        questionSoundRef.current = newSound;
        setIsQuestionPlaying(true);
        audioOperationRef.current = false;
        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
        setIsQuestionPlaying(false);
      } else if (status.didJustFinish || (status.positionMillis && status.durationMillis && status.positionMillis >= status.durationMillis - 100)) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        setIsQuestionPlaying(true);
      } else {
        await sound.playAsync();
        setIsQuestionPlaying(true);
      }
    } catch (e) {
      console.warn("Audio playback error:", e);
    } finally {
      audioOperationRef.current = false;
    }
  };

  const toggleRecordedPlayback = async () => {
    if (audioOperationRef.current) return;
    audioOperationRef.current = true;

    try {
      if (!recordedUri) {
        audioOperationRef.current = false;
        return;
      }

      if (isPlayingRecording && recordedSoundRef.current) {
        await recordedSoundRef.current.stopAsync();
        setIsPlayingRecording(false);
        audioOperationRef.current = false;
        return;
      }

      if (!recordedSoundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true },
          (status) => {
            if (isUnmountingRef.current) return;
            if (status.isLoaded && status.didJustFinish) {
              setIsPlayingRecording(false);
            }
          }
        );
        recordedSoundRef.current = sound;
        setIsPlayingRecording(true);
        audioOperationRef.current = false;
        return;
      }

      const sound = recordedSoundRef.current;
      const status = await sound.getStatusAsync();

      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlayingRecording(false);
        } else {
          await sound.playAsync();
          setIsPlayingRecording(true);
        }
      }
    } catch (e) {
      setIsPlayingRecording(false);
    } finally {
      audioOperationRef.current = false;
    }
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Body>Item not found (ID: {itemId})</Body>
          <Body style={{ fontSize: 12, marginTop: 10 }}>
            Available items: {items.map((i) => i.id).join(", ")}
          </Body>
        </View>
      </View>
    );
  }

  if (!item.imageUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Body>Image URL not available for: {item.word || "unknown"}</Body>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Centered Content */}
      <View style={styles.content}>
        {/* Unified Flashcard */}
        <View style={styles.card}>
          {/* Image Area - Takes remaining space */}
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                recyclingKey={String(item.id)}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Body>No image available</Body>
              </View>
            )}
          </View>

          {/* Footer Area: Word + Floating Play Button */}
          <View style={styles.cardFooter}>
            <View style={styles.wordContainerWithPadding}>
              <Title size="large" style={styles.word}>
                {item.word}
              </Title>
            </View>
            <View style={styles.floatingButtonContainer}>
              <DuoButton
                title=""
                onPress={playItemAudio}
                color={isQuestionPlaying ? "orange" : "blue"}
                size="medium"
                customSize={56}
                style={styles.floatingAudioButton}
                icon={isQuestionPlaying ? "pause" : "volume-high"}
                shape="circle"
                iconSize={24}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Record Button Container */}
        <View style={styles.recordButtonContainer}>
          {/* Show timer when recording */}
          {isRecording && (
            <View style={styles.timerContainer}>
              <Body style={styles.timerText}>
                {MAX_RECORDING_TIME - recordingTime}s
              </Body>
            </View>
          )}

          {/* Multiple Ripples */}
          {isRecording && (
            <>
              <Ring index={0} isRecording={isRecording} />
              <Ring index={1} isRecording={isRecording} />
              <Ring index={2} isRecording={isRecording} />
            </>
          )}

          <DuoButton
            title=""
            onPress={isRecording ? stopRecording : startRecording}
            color={isRecording ? "red" : "orange"}
            size="large"
            customSize={100}
            style={styles.recordButton}
            icon={isRecording ? "stop" : "mic"}
            shape="circle"
            iconSize={48}
          />
        </View>

        {/* Playback Button - Toggles Play/Stop */}
        {recordedUri && !isRecording && (
          <View style={styles.playbackContainer}>
            <DuoButton
              title=""
              onPress={toggleRecordedPlayback}
              color={isPlayingRecording ? "red" : "green"}
              size="medium"
              customSize={70}
              style={styles.playbackButton}
              icon={isPlayingRecording ? "pause" : "play"}
              shape="circle"
              iconSize={32}
            />
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  card: {
    width: "93%",
    maxWidth: 360,
    aspectRatio: 0.8,
    backgroundColor: "white",
    borderRadius: 40,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "column",
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24, // Slightly less round, more standard
    overflow: "hidden",
    backgroundColor: "#FFF5E6", // Light Orange background to define shape
    borderWidth: 2,
    borderColor: "#FFE0B2", // Subtle border
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  cardFooter: {
    width: "100%",
    position: "relative",
    paddingRight: 68,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 2,
    borderTopColor: "#f0f0f0",
    minHeight: 96,
  },
  wordContainerWithPadding: {
    flex: 1,
    paddingLeft: 8,
    minHeight: 60,
    justifyContent: "center",
  },
  word: {
    fontFamily: "FredokaOne",
    fontSize: 32,
    color: "#4A4A4A",
    textAlign: "left",
    flexWrap: "wrap",
  },
  floatingButtonContainer: {
    position: "absolute",
    right: -8,
    bottom: -8,
    width: 64,
    height: 64,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  floatingAudioButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
    marginBottom: -16,
    marginRight: -16,
  },
  controls: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 20, // Reduced from 40 to move buttons lower
    justifyContent: "center",
    height: 120,
    flexDirection: "row",
    gap: 30,
  },
  recordButtonContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    position: "relative",
  },
  recordButton: {
    zIndex: 10,
  },
  blob: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: -1,
  },
  playbackContainer: {
    // Removed absolute positioning so it flows in flex row
    zIndex: 3,
  },
  playbackButton: {
    // Width/Height handled by customSize prop now
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  timerContainer: {
    position: "absolute",
    top: -30,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 20,
  },
  timerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

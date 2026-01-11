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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // State for recording playback specifically
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  // State for recording time limit
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_RECORDING_TIME = 15; // 15 seconds

  // Ref to track if component is unmounting to avoid false errors
  const isUnmountingRef = React.useRef(false);

  // Get item for this exercise
  // For LookAndSay, use answerId if available, otherwise use the first optionId
  const itemId =
    exercise.answerId ??
    (exercise.optionIds.length > 0 ? exercise.optionIds[0] : undefined);
  const item = itemId ? items.find((i) => i.id === itemId) : undefined;

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
      // Cleanup recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [sound]);

  // Request permissions and check audio playback capabilities
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        // First check if permissions are already granted
        const { status: currentStatus } = await Audio.getPermissionsAsync();

        // Only request permissions if not already granted
        if (currentStatus !== "granted") {
          const { status } = await Audio.requestPermissionsAsync();

          if (status !== "granted") {
            Alert.alert(
              t('exercise.permissionRequired'),
              t('exercise.microphonePermissionNeeded')
            );
          }
        }
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      // Check permissions before attempting to record
      if (Platform.OS !== "web") {
        const { status: currentStatus } = await Audio.getPermissionsAsync();

        if (currentStatus !== "granted") {
          const { status } = await Audio.requestPermissionsAsync();

          if (status !== "granted") {
            Alert.alert(
              t('exercise.permissionRequired'),
              t('exercise.microphonePermissionRequired')
            );
            return;
          }
        }
      }

      // Stop any active sound playback before starting recording
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          // Ignore errors during cleanup
        }
        setSound(null);
        setIsPlaying(false);
        setIsPlayingRecording(false);
      }

      // Set audio mode to allow recording
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
        return;
      }

      // Create recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0); // Reset timer

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop at MAX_RECORDING_TIME
          if (newTime >= MAX_RECORDING_TIME) {
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
          }
          return newTime;
        });
      }, 1000); // Update every second
    } catch (err) {
      // Reset state on failure
      setIsRecording(false);
      setRecording(null);

      // Show user-friendly error message
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      Alert.alert(
        t('exercise.recordingFailed'),
        t('exercise.recordingFailedMessage', { error: errorMessage })
      );

      console.error("Failed to start recording:", err);
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
    // Use exercise.questionAudioUrl if available, otherwise fall back to item.audioUrl
    const audioUrl = exercise.questionAudioUrl || item?.audioUrl;

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

  const togglePlayback = async () => {
    // If currently playing recording, stop it
    if (isPlayingRecording && sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (err) {
        // Error stopping sound
      }
      setSound(null);
      setIsPlayingRecording(false);
      return;
    }

    if (!recordedUri) return;

    try {
      // Unload any prior sound
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (e) {}
      }

      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: recordedUri,
      });
      setSound(newSound);
      setIsPlayingRecording(true);
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingRecording(false);
          // Don't nullify sound immediately if we want to support replay without reload,
          // but for toggle logic simplicity we reset state.
        }
      });
    } catch (error) {
      setIsPlayingRecording(false);
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

          {/* Footer Area: Word + Play Button */}
          <View style={styles.cardFooter}>
            <View style={styles.wordContainer}>
              <Title size="large" style={styles.word} numberOfLines={2}>
                {item.word}
              </Title>
            </View>
            <DuoButton
              title=""
              onPress={playItemAudio}
              color="blue"
              size="medium"
              customSize={60}
              style={styles.audioButton}
              icon="volume-high"
              shape="circle"
              iconSize={28}
            />
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
              onPress={togglePlayback}
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
    width: "90%",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  wordContainer: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  word: {
    fontFamily: "FredokaOne",
    fontSize: 36,
    color: "#4A4A4A",
    flexShrink: 1,
  },
  audioButton: {
    // Width/Height handled by customSize prop now
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

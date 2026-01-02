import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useEffect, useState } from "react";
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
import { DuoButton } from "../DuoButton";
import { Body, Title } from "../Typography";
import ImageWithLoader from "../common/ImageWithLoader";

interface LookAndSayProps {
  exercise: Exercise;
  onComplete: () => void;
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

export default function LookAndSay({ exercise, onComplete }: LookAndSayProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // State for recording playback specifically
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

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
    };
  }, [sound]);

  // Request permissions and check audio playback capabilities
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        // Check microphone permission for recording
        const { status } = await Audio.requestPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Microphone permission is required to record audio"
          );
        }
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      // Failed to start recording
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri);
    setRecording(null);
    onComplete();
  };

  const playItemAudio = async () => {
    // Use exercise.questionAudioUrl if available, otherwise fall back to item.audioUrl
    const audioUrl = exercise.questionAudioUrl || item?.audioUrl;

    if (!audioUrl || audioUrl.trim() === "") {
      Alert.alert(
        "Audio not available",
        "Audio file is not available for this exercise"
      );
      return;
    }

    // Validate URL format
    if (
      !audioUrl.startsWith("http://") &&
      !audioUrl.startsWith("https://") &&
      !audioUrl.startsWith("file://")
    ) {
      Alert.alert("Invalid URL", "The audio URL format is invalid");
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
              "Permission Required",
              "Audio playback requires permission. Please grant audio permission in settings."
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
                  "Audio Not Playing",
                  "Audio is loaded but not playing. Please check:\n• Device volume is not muted\n• Device is not in silent/Do Not Disturb mode\n• Audio output is connected"
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
      Alert.alert(
        "Error",
        `Failed to play audio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
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
              <ImageWithLoader
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onLoad={() => {}}
                onError={() => {
                  // The ImageWithLoader component will show a placeholder
                }}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Body>No image available</Body>
              </View>
            )}
          </View>

          {/* Footer Area: Word + Play Button */}
          <View style={styles.cardFooter}>
            <Title size="xlarge" style={styles.word}>
              {item.word}
            </Title>
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
}

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
    padding: 12, // Reduced padding
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
    marginBottom: 10,
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
    paddingHorizontal: 16, // Adjusted padding
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#f0f0f0",
  },
  word: {
    fontFamily: "FredokaOne",
    fontSize: 48,
    color: "#4A4A4A",
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
});

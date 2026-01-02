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

  // Debug logging
  useEffect(() => {
    console.log("LookAndSay Debug:", {
      exerciseId: exercise.order,
      itemId,
      itemsCount: items.length,
      item: item
        ? {
            id: item.id,
            word: item.word,
            hasImage: !!item.imageUrl,
            hasAudio: !!item.audioUrl,
          }
        : null,
      questionAudioUrl: exercise.questionAudioUrl,
      allItems: items.map((i) => ({
        id: i.id,
        word: i.word,
        imageUrl: i.imageUrl,
        audioUrl: i.audioUrl,
      })),
    });
  }, [exercise, item, itemId]);

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
        console.log("Audio Permissions Status:", {
          microphone: status,
          platform: Platform.OS,
        });

        if (status !== "granted") {
          console.warn("Microphone permission not granted:", status);
          Alert.alert(
            "Permission needed",
            "Microphone permission is required to record audio"
          );
        } else {
          console.log("✓ Microphone permission granted");
        }
      } else {
        console.log("Running on web - permissions handled by browser");
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

    console.log("playItemAudio called:", {
      questionAudioUrl: exercise.questionAudioUrl,
      itemAudioUrl: item?.audioUrl,
      finalAudioUrl: audioUrl,
    });

    if (!audioUrl || audioUrl.trim() === "") {
      console.warn("No audio URL available");
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
      console.error("Invalid audio URL format:", audioUrl);
      Alert.alert("Invalid URL", "The audio URL format is invalid");
      return;
    }

    try {
      // Check permissions before playing
      if (Platform.OS !== "web") {
        const { status } = await Audio.getPermissionsAsync();
        console.log("Audio Permission Check Before Playback:", {
          status,
          granted: status === "granted",
          platform: Platform.OS,
        });

        if (status !== "granted") {
          console.warn("Audio permission not granted, requesting...");
          const { status: newStatus } = await Audio.requestPermissionsAsync();
          console.log("Permission Request Result:", newStatus);

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
          console.log("Error cleaning up previous sound (ignored):", e);
        }
        setSound(null);
      }

      setIsPlaying(true);
      console.log("Loading audio from URL:", audioUrl);

      // Set audio mode for playback - ensure it plays even in silent mode
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          // Android specific: ensure audio plays through speaker/headphones
          shouldDuckAndroid: false, // Don't duck other audio
        });
        console.log("✓ Audio mode set successfully for playback");
      } catch (audioModeError) {
        console.warn("Error setting audio mode:", audioModeError);
        // Continue anyway - might still work
      }

      console.log("Creating audio sound object...");
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      console.log("✓ Audio sound object created");

      // Get initial status
      const status = await newSound.getStatusAsync();
      console.log("Audio Status After Creation:", {
        isLoaded: status.isLoaded,
        shouldPlay: status.isLoaded ? status.shouldPlay : "N/A",
        isPlaying: status.isLoaded ? status.isPlaying : "N/A",
        error: status.isLoaded ? null : "Not loaded",
        durationMillis: status.isLoaded ? status.durationMillis : "N/A",
        positionMillis: status.isLoaded ? status.positionMillis : "N/A",
      });

      if (status.isLoaded) {
        if (status.shouldPlay && status.isPlaying) {
          console.log("✓ Audio playback started successfully");
          console.log("Audio Info:", {
            duration: status.durationMillis
              ? `${(status.durationMillis / 1000).toFixed(2)}s`
              : "unknown",
            volume: status.volume !== undefined ? status.volume : "default",
            isMuted: status.isMuted !== undefined ? status.isMuted : false,
          });
        } else if (status.shouldPlay && !status.isPlaying) {
          console.warn(
            "⚠ Audio should play but isPlaying is false - attempting to play manually"
          );
          await newSound.playAsync();
          console.log("✓ Manual playAsync() called");
        } else {
          console.warn(
            "⚠ Audio loaded but shouldPlay is false - attempting to play manually"
          );
          await newSound.playAsync();
          console.log("✓ Manual playAsync() called");
        }

        // Check status again after a brief delay to confirm playback
        setTimeout(async () => {
          try {
            const updatedStatus = await newSound.getStatusAsync();
            if (updatedStatus.isLoaded) {
              const duration = updatedStatus.durationMillis || 0;
              const position = updatedStatus.positionMillis || 0;
              console.log("Audio Status After Playback Attempt:", {
                isPlaying: updatedStatus.isPlaying,
                position:
                  duration > 0
                    ? `${(position / 1000).toFixed(2)}s / ${(
                        duration / 1000
                      ).toFixed(2)}s`
                    : `${(position / 1000).toFixed(2)}s`,
                progress:
                  duration > 0
                    ? `${((position / duration) * 100).toFixed(1)}%`
                    : "N/A",
              });

              if (
                !updatedStatus.isPlaying &&
                updatedStatus.positionMillis === 0
              ) {
                console.warn(
                  "⚠ Audio is not playing - check device volume and audio settings"
                );
                Alert.alert(
                  "Audio Not Playing",
                  "Audio is loaded but not playing. Please check:\n• Device volume is not muted\n• Device is not in silent/Do Not Disturb mode\n• Audio output is connected"
                );
              } else if (updatedStatus.isPlaying) {
                console.log(
                  "✓ Audio is playing successfully - if you can't hear it, check device volume"
                );
              }
            }
          } catch (e) {
            console.warn("Could not get updated status:", e);
          }
        }, 500);
      } else {
        console.warn("⚠ Audio not loaded after creation");
      }

      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        // Don't process status updates if component is unmounting
        if (isUnmountingRef.current) return;

        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
            console.log("Audio playback finished");
          }
        } else {
          // status.isLoaded is false - only log if we're actively playing
          // This can happen during cleanup, so we check isUnmountingRef
          if (isPlaying && !isUnmountingRef.current) {
            console.warn(
              "Audio status: isLoaded false (may be loading or error)"
            );
            // Don't show alert - let it try to load
          }
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
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
    console.warn("LookAndSay: Item not found", {
      itemId,
      itemsCount: items.length,
      optionIds: exercise.optionIds,
      answerId: exercise.answerId,
    });
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
    console.warn("LookAndSay: Image URL not available", {
      itemId: item.id,
      word: item.word,
    });
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
                onLoad={() =>
                  console.log("Image loaded successfully:", item.imageUrl)
                }
                onError={() => {
                  console.warn("Image failed to load:", item.imageUrl);
                  // Don't show alert - just log the warning
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

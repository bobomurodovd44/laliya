import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DuoButton } from "../components/DuoButton";
import StarRating from "../components/StarRating";
import { PageContainer } from "../components/layout/PageContainer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Body, Title } from "../components/Typography";
import { Colors, Spacing } from "../constants";
import app from "../lib/feathers/feathers-client";
import { useAuthStore } from "../lib/store/auth-store";

interface Answer {
  _id: string;
  audioId?: string;
  userId: string;
  exerciseId: string;
  mark?: number;
  createdAt: number;
  updatedAt: number;
  exercise?: {
    question: string;
    type: string;
    stageId?: string;
    options?: Array<{
      _id: string;
      word?: string;
      img?: {
        name: string;
        fileType: string;
        size: number;
      };
    }>;
  };
  audio?: {
    name: string;
    fileType: string;
    size: number;
  };
}

export default function StageAnswers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  const stageId = params.stageId as string;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMark, setSelectedMark] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isUnmountingRef = useRef(false);

  const currentAnswer = answers[currentIndex];

  // Fetch answers for the stage
  const fetchAnswers = useCallback(async () => {
    if (!user?._id || !stageId) {
      setError("User or stage ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId =
        typeof user._id === "string" ? user._id : String(user._id);

      // Fetch answers for this stage using stageId query
      const response = await app.service("answers").find({
        query: {
          userId: userId,
          stageId: stageId,
          $sort: { createdAt: -1 },
        },
      });

      const answersData = Array.isArray(response)
        ? response
        : response.data || [];

      // Filter to only show look_and_say exercises
      const filteredAnswers = answersData.filter(
        (item: Answer) => item.exercise?.type === "look_and_say"
      );

      setAnswers(filteredAnswers);
      if (filteredAnswers.length > 0) {
        // Set initial mark if answer already has one
        setSelectedMark(filteredAnswers[0].mark || null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load answers");
      console.error("Error fetching answers:", err);
    } finally {
      setLoading(false);
    }
  }, [user?._id, stageId]);

  useEffect(() => {
    fetchAnswers();
  }, [fetchAnswers]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (sound) {
        sound.setOnPlaybackStatusUpdate(null);
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  // Update selected mark when current answer changes
  useEffect(() => {
    if (currentAnswer) {
      setSelectedMark(currentAnswer.mark || null);
    }
    // Reset playing state when answer changes
    setIsPlaying(false);
    if (sound) {
      sound.setOnPlaybackStatusUpdate(null);
      sound.unloadAsync().catch(() => {});
      setSound(null);
    }
  }, [currentAnswer]);

  // Play answer audio
  const playAnswerAudio = useCallback(async () => {
    console.log("playAnswerAudio called", { 
      hasAudio: !!currentAnswer?.audio?.name,
      isPlaying,
      hasSound: !!sound 
    });

    if (!currentAnswer?.audio?.name) {
      Alert.alert(
        "Audio not available",
        "Audio file is not available for this answer"
      );
      return;
    }

    const audioUrl = currentAnswer.audio.name;
    console.log("Audio URL:", audioUrl);

    // If currently playing, pause it
    if (isPlaying && sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          console.log("Pausing audio");
          await sound.pauseAsync();
          setIsPlaying(false);
          return;
        }
      } catch (e) {
        console.error("Error pausing audio:", e);
      }
    }

    // If paused, resume playback
    if (!isPlaying && sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying && !status.didJustFinish) {
          console.log("Resuming audio");
          await sound.playAsync();
          setIsPlaying(true);
          return;
        }
      } catch (e) {
        console.error("Error resuming audio:", e);
        // If resume fails, continue to create new sound
      }
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
          sound.setOnPlaybackStatusUpdate(null);
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          // Ignore errors during cleanup
        }
        setSound(null);
      }

      // Set audio mode for playback
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
      } catch (audioModeError) {
        // Continue anyway
      }

      console.log("Creating new sound with URL:", audioUrl);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      console.log("Sound created, setting state");
      setSound(newSound);
      setIsPlaying(true);

      // Get initial status
      const status = await newSound.getStatusAsync();
      console.log("Initial status:", status);

      if (status.isLoaded) {
        // Always call playAsync to ensure audio starts playing
        // Even if isPlaying is true, positionMillis might be 0 (not actually playing)
        console.log("Calling playAsync() to ensure playback");
        await newSound.playAsync();
        
        // Verify it's actually playing after a short delay
        setTimeout(async () => {
          try {
            const verifyStatus = await newSound.getStatusAsync();
            console.log("Verification status:", verifyStatus);
            if (verifyStatus.isLoaded && !verifyStatus.isPlaying && verifyStatus.positionMillis === 0) {
              console.log("Audio not actually playing, trying again");
              await newSound.playAsync();
            }
          } catch (e) {
            console.error("Error verifying playback:", e);
          }
        }, 100);

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
          // Update playing state - use isPlaying directly, not positionMillis
          // positionMillis can be 0 at the start even when playing
          setIsPlaying(status.isPlaying);
          
          // Reset when audio finishes
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        } else {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Error in playAnswerAudio:", error);
      setIsPlaying(false);
      setSound(null);
      Alert.alert(
        "Error",
        `Failed to play audio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [currentAnswer, sound, isPlaying]);

  // Handle next button
  const handleNext = useCallback(async () => {
    if (!currentAnswer) return;

    // Save mark if selected
    if (selectedMark !== null && selectedMark !== currentAnswer.mark) {
      try {
        await app.service("answers").patch(currentAnswer._id, {
          mark: selectedMark,
        });
        // Update local state to reflect the saved mark
        setAnswers((prev) =>
          prev.map((ans) =>
            ans._id === currentAnswer._id ? { ...ans, mark: selectedMark } : ans
          )
        );
      } catch (err) {
        console.error("Error saving mark:", err);
        // Continue even if save fails
      }
    }

    // Move to next answer
    if (currentIndex < answers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All answers reviewed, go back
      router.back();
    }
  }, [currentAnswer, selectedMark, currentIndex, answers.length, router]);

  // Get item image for current answer
  const imageUrl = currentAnswer?.exercise?.options?.[0]?.img?.name;
  const itemWord = currentAnswer?.exercise?.options?.[0]?.word || "";

  if (loading) {
    return (
      <PageContainer>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={28} color={Colors.textWhite} />
            </View>
          </TouchableOpacity>
          <Title size="medium" style={styles.headerTitle}>
            Review Answers
          </Title>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <LoadingSpinner message="Loading answers..." />
        </View>
      </PageContainer>
    );
  }

  if (error || answers.length === 0) {
    return (
      <PageContainer>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={28} color={Colors.textWhite} />
            </View>
          </TouchableOpacity>
          <Title size="medium" style={styles.headerTitle}>
            Review Answers
          </Title>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <Body style={styles.errorText}>
            {error || "No answers found for this stage"}
          </Body>
          <DuoButton
            title="Go Back"
            onPress={() => router.back()}
            color="blue"
            size="medium"
          />
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={28} color={Colors.textWhite} />
          </View>
        </TouchableOpacity>
        <Title size="medium" style={styles.headerTitle}>
          Review Answers ({currentIndex + 1}/{answers.length})
        </Title>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.container, { paddingTop: insets.top + 120 }]}>
        {/* Centered Content */}
        <View style={styles.content}>
          {/* Unified Flashcard */}
          <View style={styles.card}>
            {/* Image Area */}
            <View style={styles.imageContainer}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  contentFit="cover"
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
                  {itemWord}
                </Title>
              </View>
              <DuoButton
                title=""
                onPress={playAnswerAudio}
                color="blue"
                size="medium"
                customSize={60}
                style={styles.audioButton}
                icon={isPlaying ? "pause" : "volume-high"}
                shape="circle"
                iconSize={28}
              />
            </View>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          {/* Star Rating */}
          <View style={styles.ratingContainer}>
            <StarRating
              value={selectedMark}
              onChange={setSelectedMark}
              size={40}
            />
          </View>

          {/* Next Button */}
          <View style={styles.nextButtonContainer}>
            <DuoButton
              title={currentIndex < answers.length - 1 ? "Next" : "Finish"}
              onPress={handleNext}
              color="green"
              size="large"
            />
          </View>
        </View>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.padding.lg,
    paddingVertical: Spacing.padding.md,
    borderBottomWidth: Spacing.borderWidth.medium,
    borderBottomColor: Colors.borderDark,
  },
  backButton: {
    padding: Spacing.padding.xs,
  },
  backButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.badgeLevel,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: Colors.accentBlue,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    textAlign: "center",
  },
  headerSpacer: {
    width: 48,
  },
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingTop: 20,
  },
  card: {
    width: "85%",
    maxWidth: 340,
    aspectRatio: 0.78,
    backgroundColor: "white",
    borderRadius: 36,
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
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFF5E6",
    borderWidth: 2,
    borderColor: "#FFE0B2",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
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
    // Width/Height handled by customSize prop
  },
  controls: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 20,
    justifyContent: "center",
    gap: 30,
  },
  ratingContainer: {
    alignItems: "center",
    gap: Spacing.margin.md,
  },
  ratingLabel: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  nextButtonContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: Spacing.padding.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.padding.xl,
    gap: Spacing.margin.lg,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.margin.md,
  },
});


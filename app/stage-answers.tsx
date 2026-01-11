import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DuoButton } from "../components/DuoButton";
import { PageContainer } from "../components/layout/PageContainer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import StarRating from "../components/StarRating";
import { Body, Title } from "../components/Typography";
import { Colors, Spacing } from "../constants";
import app from "../lib/feathers/feathers-client";
import { useTranslation } from "../lib/localization";
import { useAuthStore } from "../lib/store/auth-store";
import { getCachedAnswers, setCachedAnswers } from "../lib/cache/answers-cache";

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
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const stageId = params.stageId as string;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMark, setSelectedMark] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isUnmountingRef = useRef(false);

  const currentAnswer = answers[currentIndex];
  const imageUrl = currentAnswer?.exercise?.options?.[0]?.img?.name;
  const itemWord = currentAnswer?.exercise?.options?.[0]?.word || "";

  // Fetch answers for the stage
  const fetchAnswers = useCallback(async (skipCache = false) => {
    if (!user?._id || !stageId) {
      setError(t("answers.userNotFound") + " " + t("answers.stageIdNotFound"));
      setLoading(false);
      return;
    }

    try {
      const userId = typeof user._id === "string" ? user._id : String(user._id);

      // Check cache first (unless skipping cache for refresh)
      if (!skipCache) {
        const cachedAnswers = getCachedAnswers(userId, stageId);
        if (cachedAnswers) {
          // Use cached data - instant load
          setAnswers(cachedAnswers);
          if (cachedAnswers.length > 0) {
            setSelectedMark(cachedAnswers[0].mark ?? 0);
          }
          setLoading(false);
          return;
        }
      }

      // Show loading only if not refreshing
      if (!skipCache) {
        setLoading(true);
      }
      setError(null);

      // Fetch answers with population for needed data
      const response = await app.service("answers").find({
        query: {
          userId: userId,
          stageId: stageId,
          $sort: { createdAt: -1 },
          $populate: true, // Need exercise.options and audio data
        },
      });

      const answersData = Array.isArray(response)
        ? response
        : response.data || [];

      // Filter to only look_and_say exercises (backend doesn't support nested query)
      const filteredAnswers = answersData.filter(
        (item: Answer) => item.exercise?.type === "look_and_say"
      );

      // Cache the filtered results
      setCachedAnswers(userId, filteredAnswers, stageId);

      setAnswers(filteredAnswers);
      if (filteredAnswers.length > 0) {
        // Treat null/undefined as 0 (undone)
        setSelectedMark(filteredAnswers[0].mark ?? 0);
      }
    } catch (err: any) {
      setError(err.message || t("answers.failedToLoadAnswers"));
      console.error("Error fetching answers:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id, stageId, t]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnswers(true); // Skip cache to get fresh data
  }, [fetchAnswers]);

  // Reset index when stageId changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [stageId]);

  // Fetch answers every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAnswers();
    }, [fetchAnswers])
  );

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

  // Update selected mark and reset audio when current answer changes
  useEffect(() => {
    if (currentAnswer) {
      // Treat null/undefined as 0
      const newMark = currentAnswer.mark ?? 0;
      setSelectedMark(newMark);
    }
    setIsPlaying(false);
  }, [currentAnswer]);

  // Request audio permissions
  const requestAudioPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;

    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status === "granted") return true;

      const { status: newStatus } = await Audio.requestPermissionsAsync();
      if (newStatus === "granted") return true;

      Alert.alert(
        t("answers.permissionRequired"),
        t("answers.audioPermissionMessage")
      );
      return false;
    } catch {
      return false;
    }
  }, []);

  // Play answer audio - toggle playback logic from LookAndSay
  const playAnswerAudio = useCallback(async () => {
    if (!currentAnswer?.audio?.name) {
      Alert.alert(
        t("answers.audioNotAvailable"),
        t("answers.audioFileNotAvailable")
      );
      return;
    }

    const audioUrl = currentAnswer.audio.name;

    // If currently playing, stop it
    if (isPlaying && sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (err) {
        // Error stopping sound
      }
      setSound(null);
      setIsPlaying(false);
      return;
    }

    try {
      // Unload any prior sound
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (e) {}
      }

      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: audioUrl,
      });
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      setIsPlaying(false);
      setSound(null);
      console.error("Error playing audio:", error);
    }
  }, [currentAnswer, sound, isPlaying]);

  // Save mark helper function
  const saveMark = useCallback(async (answer: Answer, mark: number) => {
    // Compare with answer.mark, treating null/undefined as 0
    const currentMark = answer.mark ?? 0;
    if (mark !== currentMark) {
      try {
        await app.service("answers").patch(answer._id, {
          mark: mark,
        });
        setAnswers((prev) =>
          prev.map((ans) =>
            ans._id === answer._id ? { ...ans, mark: mark } : ans
          )
        );
      } catch (err) {
        console.error("Error saving mark:", err);
      }
    }
  }, []);

  // Handle star rating change
  const handleMarkChange = useCallback((value: number) => {
    setSelectedMark(value);
  }, []);

  // Handle prev button
  const handlePrev = useCallback(async () => {
    if (!currentAnswer || currentIndex === 0) return;

    // Save mark if selected
    await saveMark(currentAnswer, selectedMark);

    // Move to previous answer
    setCurrentIndex(currentIndex - 1);
  }, [currentAnswer, selectedMark, currentIndex, saveMark]);

  // Handle next button
  const handleNext = useCallback(async () => {
    if (!currentAnswer) return;

    // Save mark if selected
    await saveMark(currentAnswer, selectedMark);

    // Move to next answer
    if (currentIndex < answers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push("/child-answers");
    }
  }, [
    currentAnswer,
    selectedMark,
    currentIndex,
    answers.length,
    router,
    saveMark,
  ]);

  // Render header
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/child-answers")}
        activeOpacity={0.7}
      >
        <View style={styles.backButtonContainer}>
          <Ionicons name="arrow-back" size={28} color={Colors.textWhite} />
        </View>
      </TouchableOpacity>
      <Title size="medium" style={styles.headerTitle}>
        {loading
          ? t("answers.reviewAnswers")
          : `${t("answers.reviewAnswers")} (${currentIndex + 1}/${answers.length})`}
      </Title>
      <View style={styles.headerSpacer} />
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <PageContainer>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <LoadingSpinner message={t("answers.loadingAnswers")} />
        </View>
      </PageContainer>
    );
  }

  // Render error state
  if (error || answers.length === 0) {
    return (
      <PageContainer>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Body style={styles.errorText}>
            {error || t("answers.noAnswersFound")}
          </Body>
          <DuoButton
            title={t("answers.goBack")}
            onPress={() => router.push("/child-answers")}
            color="blue"
            size="medium"
          />
        </View>
      </PageContainer>
    );
  }

  // Render main content
  return (
    <PageContainer>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 120 }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressViewOffset={insets.top + 80}
          />
        }
      >
        <View style={styles.container}>
          {/* Centered Card Content */}
          <View style={styles.content}>
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
                    <Body>{t("answers.noImageAvailable")}</Body>
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
                  customSize={70}
                  style={styles.audioButton}
                  icon={isPlaying ? "pause" : "play"}
                  shape="circle"
                  iconSize={32}
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
                onChange={handleMarkChange}
                size={48}
              />
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtonsContainer}>
              {currentIndex > 0 && (
                <View style={styles.buttonWrapper}>
                  <DuoButton
                    title=""
                    onPress={handlePrev}
                    color="blue"
                    size="large"
                    icon="chevron-back"
                    shape="rectangle"
                    iconSize={28}
                  />
                </View>
              )}
              <View style={styles.buttonWrapper}>
                <DuoButton
                  title=""
                  onPress={handleNext}
                  color="green"
                  size="large"
                  icon={
                    currentIndex < answers.length - 1
                      ? "chevron-forward"
                      : "checkmark"
                  }
                  shape="rectangle"
                  iconSize={28}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: "100%",
    paddingBottom: Spacing.padding.xxl,
  },
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
    minHeight: "100%",
  },
  content: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 20,
  },
  card: {
    width: "85%",
    maxWidth: 340,
    aspectRatio: 0.78,
    backgroundColor: "white",
    borderRadius: 36,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "column",
    borderWidth: 2,
    borderColor: "#f5f5f5",
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFF5E6",
    borderWidth: 2,
    borderColor: "#FFE0B2",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
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
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#f0f0f0",
    gap: 16,
  },
  wordContainer: {
    flex: 1,
    flexShrink: 1,
  },
  word: {
    fontFamily: "FredokaOne",
    fontSize: 32,
    color: "#4A4A4A",
    flexShrink: 1,
  },
  audioButton: {
    marginLeft: 8,
    flexShrink: 0,
  },
  controls: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 20,
    justifyContent: "center",
    gap: 32,
  },
  ratingContainer: {
    alignItems: "center",
    gap: Spacing.margin.lg,
  },
  navigationButtonsContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.padding.lg,
    gap: Spacing.margin.lg,
  },
  buttonWrapper: {
    flex: 1,
    maxWidth: 150,
    alignItems: "center",
    justifyContent: "center",
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

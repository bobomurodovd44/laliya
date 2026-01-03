import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../components/layout/PageContainer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Body, Title } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import app from "../lib/feathers/feathers-client";
import { useAuthStore } from "../lib/store/auth-store";

interface Answer {
  _id: string;
  audioId: string;
  userId: string;
  exerciseId: string;
  createdAt: number;
  updatedAt: number;
  exercise?: {
    question: string;
    type: string;
    stage?: {
      order: number;
    };
    options?: Array<{
      _id: string;
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

const LIMIT = 10;

export default function ChildAnswers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Fetch answers from service
  const fetchAnswers = useCallback(
    async (currentSkip: number, append: boolean = false) => {
      if (!user?._id) {
        setError("User not found");
        setLoading(false);
        return;
      }

      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const userId =
          typeof user._id === "string" ? user._id : String(user._id);

        const response = await app.service("answers").find({
          query: {
            userId: userId,
            $sort: { createdAt: -1 },
            $limit: LIMIT,
            $skip: currentSkip,
          },
        });

        const answersData = Array.isArray(response)
          ? response
          : response.data || [];

        const total = Array.isArray(response)
          ? answersData.length
          : response.total || answersData.length;

        if (append) {
          setAnswers((prev) => [...prev, ...answersData]);
        } else {
          setAnswers(answersData);
        }

        setHasMore(answersData.length === LIMIT && total > currentSkip + LIMIT);
        setSkip(currentSkip + answersData.length);
      } catch (err: any) {
        setError(err.message || "Failed to load answers");
        console.error("Error fetching answers:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user?._id]
  );

  // Initial load
  useEffect(() => {
    fetchAnswers(0, false);
  }, [fetchAnswers]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  // Load more answers
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchAnswers(skip, true);
    }
  }, [loadingMore, hasMore, loading, skip, fetchAnswers]);

  // Handle audio playback
  const handlePlayPause = useCallback(
    async (answer: Answer) => {
      if (!answer.audio?.name) {
        return;
      }

      try {
        // If clicking the same audio, toggle play/pause
        if (playingAudioId === answer._id && sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await sound.pauseAsync();
              setPlayingAudioId(null);
            } else {
              await sound.playAsync();
            }
          }
          return;
        }

        // Stop current audio if playing
        if (sound) {
          await sound.unloadAsync();
          setSound(null);
        }

        // Load and play new audio
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: answer.audio.name },
          { shouldPlay: true }
        );

        setSound(newSound);
        setPlayingAudioId(answer._id);

        // Handle playback finish
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingAudioId(null);
          }
        });
      } catch (err) {
        console.error("Error playing audio:", err);
        setPlayingAudioId(null);
      }
    },
    [playingAudioId, sound]
  );

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Render answer card
  const renderAnswerCard = useCallback(
    ({ item: answer }: { item: Answer }) => {
      const isPlaying = playingAudioId === answer._id;
      const imageUrl = answer.exercise?.options?.[0]?.img?.name;

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.exerciseImage}
                  contentFit="cover"
                  transition={200}
                />
              )}
              <View style={styles.cardInfo}>
                <Body weight="bold" style={styles.exerciseTitle}>
                  {answer.exercise?.question || "Look and Say"}
                </Body>
                {answer.exercise?.stage && (
                  <Body style={styles.stageInfo}>
                    Stage {answer.exercise.stage.order}
                  </Body>
                )}
                <Body style={styles.dateInfo}>
                  {formatDate(answer.createdAt)}
                </Body>
              </View>
            </View>
          </View>

          <View style={styles.audioSection}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlayPause(answer)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color={Colors.textWhite}
              />
            </TouchableOpacity>
            <View style={styles.audioInfo}>
              <Body style={styles.audioLabel}>
                {isPlaying ? "Playing..." : "Tap to play"}
              </Body>
            </View>
          </View>
        </View>
      );
    },
    [playingAudioId, handlePlayPause]
  );

  // Render footer (loading more indicator)
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <LoadingSpinner size="small" />
      </View>
    );
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setSkip(0);
    setHasMore(true);

    // Ensure minimum refresh time for better UX
    await Promise.all([
      fetchAnswers(0, false),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);

    setRefreshing(false);
  }, [fetchAnswers]);

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
          Child Answers
        </Title>
        <View style={styles.headerSpacer} />
      </View>

      {loading && answers.length === 0 ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner message="Loading answers..." />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Body style={styles.errorText}>{error}</Body>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchAnswers(0, false)}
          >
            <Body weight="bold" style={styles.retryButtonText}>
              Retry
            </Body>
          </TouchableOpacity>
        </View>
      ) : answers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="musical-notes-outline"
            size={64}
            color={Colors.textTertiary}
          />
          <Body style={styles.emptyText}>
            No answers yet. Complete Look and Say exercises to see your
            recordings here.
          </Body>
        </View>
      ) : (
        <FlatList
          data={answers}
          renderItem={renderAnswerCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: insets.top + 100 },
          ]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.badgeLevel}
              colors={[Colors.badgeLevel, Colors.accentBlue]}
              progressBackgroundColor={Colors.backgroundLight}
              progressViewOffset={
                Platform.OS === "android" ? insets.top + 80 : insets.top + 60
              }
              {...(Platform.OS === "ios" && {
                title: refreshing ? "Refreshing..." : "Pull to refresh",
                titleColor: Colors.textSecondary,
              })}
            />
          }
        />
      )}
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
  listContent: {
    paddingHorizontal: Spacing.padding.lg,
    paddingBottom: Spacing.padding.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.padding.xl,
  },
  card: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.padding.lg,
    marginBottom: Spacing.margin.md,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.borderDark,
    borderBottomWidth: Spacing.borderWidth.xxthick,
  },
  cardHeader: {
    marginBottom: Spacing.margin.md,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: Spacing.radius.md,
    marginRight: Spacing.margin.md,
    backgroundColor: Colors.backgroundDark,
  },
  cardInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.margin.xs,
  },
  stageInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.margin.xs,
  },
  dateInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  audioSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.padding.md,
    borderTopWidth: Spacing.borderWidth.thin,
    borderTopColor: Colors.borderDark,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.badgeLevel,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.margin.md,
  },
  audioInfo: {
    flex: 1,
  },
  audioLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  footerLoader: {
    paddingVertical: Spacing.padding.lg,
    alignItems: "center",
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.margin.md,
  },
  retryButton: {
    backgroundColor: Colors.badgeLevel,
    paddingHorizontal: Spacing.padding.lg,
    paddingVertical: Spacing.padding.md,
    borderRadius: Spacing.radius.md,
  },
  retryButtonText: {
    color: Colors.textWhite,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.margin.lg,
  },
});

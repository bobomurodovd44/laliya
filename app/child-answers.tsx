import { Ionicons } from "@expo/vector-icons";
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
    stageId?: string;
    stage?: {
      _id: string;
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

interface StageGroup {
  stageId: string;
  stageOrder: number;
  answerCount: number;
  latestAnswerDate: number;
  sampleImageUrl?: string;
}

export default function ChildAnswers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [stages, setStages] = useState<StageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch answers and group by stages
  const fetchStages = useCallback(async () => {
    if (!user?._id) {
      setError("User not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = typeof user._id === "string" ? user._id : String(user._id);

      // Fetch all look_and_say answers (no pagination limit)
      const response = await app.service("answers").find({
        query: {
          userId: userId,
          $sort: { createdAt: -1 },
          $limit: 1000, // Large limit to get all answers
        },
      });

      const answersData = Array.isArray(response)
        ? response
        : response.data || [];

      // Filter to only show look_and_say exercises
      const filteredAnswersData = answersData.filter(
        (item: Answer) => item.exercise?.type === "look_and_say"
      );

      // Group answers by stageId
      const stageMap = new Map<
        string,
        {
          stageId: string;
          stageOrder: number;
          answers: Answer[];
          latestDate: number;
          sampleImageUrl?: string;
        }
      >();

      filteredAnswersData.forEach((answer: Answer) => {
        const stageId = answer.exercise?.stageId || answer.exercise?.stage?._id;
        if (!stageId) return;

        const stageOrder = answer.exercise?.stage?.order || 0;
        const existing = stageMap.get(stageId);

        if (existing) {
          existing.answers.push(answer);
          if (answer.createdAt > existing.latestDate) {
            existing.latestDate = answer.createdAt;
          }
          // Update sample image if available
          if (
            !existing.sampleImageUrl &&
            answer.exercise?.options?.[0]?.img?.name
          ) {
            existing.sampleImageUrl = answer.exercise.options[0].img.name;
          }
        } else {
          stageMap.set(stageId, {
            stageId,
            stageOrder,
            answers: [answer],
            latestDate: answer.createdAt,
            sampleImageUrl: answer.exercise?.options?.[0]?.img?.name,
          });
        }
      });

      // Convert map to array and sort by stage order
      const stagesArray: StageGroup[] = Array.from(stageMap.values())
        .map((group) => ({
          stageId: group.stageId,
          stageOrder: group.stageOrder,
          answerCount: group.answers.length,
          latestAnswerDate: group.latestDate,
          sampleImageUrl: group.sampleImageUrl,
        }))
        .sort((a, b) => a.stageOrder - b.stageOrder);

      setStages(stagesArray);
    } catch (err: any) {
      setError(err.message || "Failed to load stages");
      console.error("Error fetching stages:", err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Initial load
  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

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

  // Handle stage press
  const handleStagePress = useCallback(
    (stageId: string) => {
      router.push({
        pathname: "/stage-answers",
        params: { stageId },
      } as any);
    },
    [router]
  );

  // Render stage card
  const renderStageCard = useCallback(
    ({ item: stage }: { item: StageGroup }) => {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleStagePress(stage.stageId)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              {stage.sampleImageUrl && (
                <Image
                  source={{ uri: stage.sampleImageUrl }}
                  style={styles.exerciseImage}
                  contentFit="cover"
                  transition={200}
                />
              )}
              <View style={styles.cardInfo}>
                <Body weight="bold" style={styles.exerciseTitle}>
                  Stage {stage.stageOrder}
                </Body>
                <Body style={styles.stageInfo}>
                  {stage.answerCount}{" "}
                  {stage.answerCount === 1 ? "answer" : "answers"}
                </Body>
                <Body style={styles.dateInfo}>
                  {formatDate(stage.latestAnswerDate)}
                </Body>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      );
    },
    [handleStagePress]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    // Ensure minimum refresh time for better UX
    await Promise.all([
      fetchStages(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);

    setRefreshing(false);
  }, [fetchStages]);

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

      {loading && stages.length === 0 ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner message="Loading stages..." />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Body style={styles.errorText}>{error}</Body>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchStages()}
          >
            <Body weight="bold" style={styles.retryButtonText}>
              Retry
            </Body>
          </TouchableOpacity>
        </View>
      ) : stages.length === 0 ? (
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
          data={stages}
          renderItem={renderStageCard}
          keyExtractor={(item) => item.stageId}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: insets.top + 100 },
          ]}
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

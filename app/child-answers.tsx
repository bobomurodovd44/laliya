import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "../lib/localization";
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
}

export default function ChildAnswers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [stages, setStages] = useState<StageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stage color themes for gradients
  const stageThemes = useMemo(
    () => [
      Colors.gradientOrange,
      Colors.gradientPurple,
      Colors.gradientGreen,
      Colors.gradientRed,
      Colors.gradientBlue,
    ],
    []
  );

  // Fetch answers and group by stages
  const fetchStages = useCallback(async () => {
    if (!user?._id) {
      setError(t("answers.userNotFound"));
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
        } else {
          stageMap.set(stageId, {
            stageId,
            stageOrder,
            answers: [answer],
            latestDate: answer.createdAt,
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
        }))
        .sort((a, b) => a.stageOrder - b.stageOrder);

      setStages(stagesArray);
    } catch (err: any) {
      setError(err.message || t("answers.failedToLoadStages"));
      console.error("Error fetching stages:", err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Initial load
  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

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
      const theme = stageThemes[(stage.stageOrder - 1) % stageThemes.length];
      return (
        <View style={styles.cardContainer}>
          <TouchableOpacity
            onPress={() => handleStagePress(stage.stageId)}
            activeOpacity={1}
            style={styles.cardTouchable}
          >
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardContent}>
                <View style={styles.stageTitleContainer}>
                  <Title size="medium" style={styles.stageTitle}>
                    {t("answers.stage")} {stage.stageOrder}
                  </Title>
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons
                    name="chevron-forward"
                    size={36}
                    color={Colors.textWhite}
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    },
    [handleStagePress, stageThemes]
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
    <PageContainer useFloatingShapes={true} floatingShapesCount={5}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/profile")}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={28} color={Colors.textWhite} />
          </View>
        </TouchableOpacity>
        <Title size="medium" style={styles.headerTitle}>
          {t("answers.childAnswers")}
        </Title>
        <View style={styles.headerSpacer} />
      </View>

      {loading && stages.length === 0 ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner message={t("answers.loadingStages")} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Body style={styles.errorText}>{error}</Body>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchStages()}
          >
            <Body weight="bold" style={styles.retryButtonText}>
              {t("answers.retry")}
            </Body>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stages}
          renderItem={renderStageCard}
          keyExtractor={(item) => item.stageId}
          contentContainerStyle={[
            stages.length === 0 ? styles.emptyListContent : styles.listContent,
            { paddingTop: insets.top + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons
                name="musical-notes-outline"
                size={64}
                color={Colors.textTertiary}
              />
              <Body style={styles.emptyText}>
                {t("answers.noAnswers")}
              </Body>
            </View>
          }
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
                title: refreshing ? t("answers.refreshing") : t("answers.pullToRefresh"),
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
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.padding.lg,
    paddingBottom: Spacing.padding.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.padding.xl,
  },
  cardContainer: {
    marginBottom: Spacing.margin.md,
    borderRadius: Spacing.radius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTouchable: {
    borderRadius: Spacing.radius.xl,
    overflow: "hidden",
  },
  card: {
    borderRadius: Spacing.radius.xl,
    padding: Spacing.padding.lg,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderBottomWidth: Spacing.borderWidth.xxthick,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageTitleContainer: {
    flex: 1,
    marginRight: Spacing.margin.md,
  },
  stageTitle: {
    color: Colors.textWhite,
    textAlign: "left",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  chevronContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: Spacing.radius.xxl,
    padding: Spacing.padding.xs,
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

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircularProgress } from "../components/CircularProgress";
import { PageContainer } from "../components/layout/PageContainer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Body, Title } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import app from "../lib/feathers/feathers-client";
import { useTranslation } from "../lib/localization";
import { useAuthStore } from "../lib/store/auth-store";
import { getUserMaxStageOrder } from "../lib/utils/stage-access";

interface StageAnalytics {
  stageId: string;
  stageOrder: number;
  totalExercises: number;
  completedExercises: number;
  correctAnswers: number;
  wrongAnswers: number;
  correctPercentage: number;
}

export default function UserAnalytics() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [analyticsData, setAnalyticsData] = useState({
    correctPercentage: 0,
    totalAnswers: 0,
    availableStages: 0,
  });
  const [stageAnalytics, setStageAnalytics] = useState<StageAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!user?._id) {
      setError(t("errors.userNotFound"));
      setLoading(false);
      return;
    }

    if (!refreshing) setLoading(true); // Don't show full loader on refresh
    setError(null);

    try {
      const userId =
        typeof user._id === "string" ? user._id : String(user._id);

      // Fetch all data in parallel with error boundary for isolation
      // This prevents analytics errors from affecting other features
      const [maxStageOrder, stagesResponse, exercisesResponse, answersResponse] = 
        await Promise.all([
          getUserMaxStageOrder(user.currentStageId).catch(() => 0),
          app.service("stages").find({
            query: {
              $sort: { order: 1 },
              $limit: 1000,
            },
          }).catch(() => ({ data: [] })),
          app.service("exercises").find({
            query: {
              $limit: 1000,
              $select: ["_id", "stageId"],
            },
          }).catch(() => ({ data: [] })),
          app.service("answers").find({
            query: {
              userId: userId,
              $limit: 1000,
              $populate: false,
              $select: ["_id", "exerciseId", "isCorrect"],
            },
          }).catch(() => ({ data: [] })),
        ]);

      const stages = Array.isArray(stagesResponse)
        ? stagesResponse
        : stagesResponse.data || [];
      const exercises = Array.isArray(exercisesResponse)
        ? exercisesResponse
        : exercisesResponse.data || [];
      const answersData = Array.isArray(answersResponse)
        ? answersResponse
        : answersResponse.data || [];

      // Calculate correct answers percentage (treat undefined isCorrect as true)
      const totalAnswers = answersData.length;
      const correctAnswers = answersData.filter(
        (answer: any) => answer.isCorrect === true || answer.isCorrect === undefined
      ).length;
      const correctPercentage =
        totalAnswers > 0
          ? Math.round((correctAnswers / totalAnswers) * 100)
          : 0;

      setAnalyticsData({
        correctPercentage,
        totalAnswers,
        availableStages: maxStageOrder,
      });

      // Optimize data processing with Maps for O(1) lookups
      // Group exercises by stageId
      const exercisesByStage = new Map<string, any[]>();
      exercises.forEach((ex: any) => {
        const exStageId = typeof ex.stageId === "string" ? ex.stageId : String(ex.stageId);
        if (!exercisesByStage.has(exStageId)) {
          exercisesByStage.set(exStageId, []);
        }
        exercisesByStage.get(exStageId)!.push(ex);
      });

      // Create exercise ID to stage ID mapping for fast lookup
      const exerciseIdToStageId = new Map<string, string>();
      exercises.forEach((ex: any) => {
        const exId = typeof ex._id === "string" ? ex._id : String(ex._id);
        const exStageId = typeof ex.stageId === "string" ? ex.stageId : String(ex.stageId);
        exerciseIdToStageId.set(exId, exStageId);
      });

      // Group answers by stageId using the mapping
      const answersByStage = new Map<string, any[]>();
      answersData.forEach((answer: any) => {
        const answeredExerciseId = typeof answer.exerciseId === "string" 
          ? answer.exerciseId 
          : String(answer.exerciseId);
        const stageId = exerciseIdToStageId.get(answeredExerciseId);
        if (stageId) {
          if (!answersByStage.has(stageId)) {
            answersByStage.set(stageId, []);
          }
          answersByStage.get(stageId)!.push(answer);
        }
      });

      // Calculate per-stage analytics with optimized lookups
      const stageStats: StageAnalytics[] = stages.map((stage: any) => {
        const stageId = typeof stage._id === "string" ? stage._id : String(stage._id);
        
        // Get exercises for this stage from Map (O(1) lookup)
        const stageExercises = exercisesByStage.get(stageId) || [];
        const totalExercises = stageExercises.length;
        
        // Get answers for this stage from Map (O(1) lookup)
        const stageAnswers = answersByStage.get(stageId) || [];
        
        // Count unique exercises that have been answered
        const uniqueAnsweredExercises = new Set(
          stageAnswers.map((answer: any) => 
            typeof answer.exerciseId === "string" 
              ? answer.exerciseId 
              : String(answer.exerciseId)
          )
        );
        const completedExercises = uniqueAnsweredExercises.size;
        
        // Count correct and wrong answers (treat undefined isCorrect as correct)
        const correctAnswers = stageAnswers.filter(
          (answer: any) => answer.isCorrect === true || answer.isCorrect === undefined
        ).length;
        const wrongAnswers = stageAnswers.filter(
          (answer: any) => answer.isCorrect === false
        ).length;
        
        // Calculate correct percentage
        const correctPercentage = stageAnswers.length > 0
          ? Math.round((correctAnswers / stageAnswers.length) * 100)
          : 0;
        
        return {
          stageId,
          stageOrder: stage.order,
          totalExercises,
          completedExercises,
          correctAnswers,
          wrongAnswers,
          correctPercentage,
        };
      });

      setStageAnalytics(stageStats);
    } catch (error) {
      // Isolated error handling - won't affect other features
      console.error("Analytics fetch failed:", error);
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, t]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, []);

  return (
    <PageContainer useFloatingShapes>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Title size="medium" style={styles.headerTitle}>
          {t("profile.analytics")}
        </Title>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]} // Android
              progressViewOffset={insets.top + 80}
            />
          }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner message={t("common.loading")} size="large" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={Colors.error} />
            <Body style={styles.errorText}>{error}</Body>
          </View>
        ) : (
          <>
            {/* Analytics Cards */}
            <View style={styles.cardsContainer}>
              {/* Card 1: Correct Answers Percentage */}
              <View
                style={[styles.analyticsCard, { borderColor: Colors.success }]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={36}
                  color={Colors.success}
                />
                <Title size="small" style={styles.analyticsValue}>
                  {analyticsData.correctPercentage}%
                </Title>
                <Body style={styles.analyticsLabel}>
                  {t("profile.correctAnswers")}
                </Body>
              </View>

              {/* Card 2: Total Answers Count */}
              <View
                style={[styles.analyticsCard, { borderColor: Colors.primary }]}
              >
                <Ionicons name="list" size={36} color={Colors.primary} />
                <Title size="small" style={styles.analyticsValue}>
                  {analyticsData.totalAnswers}
                </Title>
                <Body style={styles.analyticsLabel}>
                  {t("profile.totalAnswers")}
                </Body>
              </View>

              {/* Card 3: Available Stages */}
              <View
                style={[
                  styles.analyticsCard,
                  { borderColor: Colors.badgeLevel },
                ]}
              >
                <Ionicons name="layers" size={36} color={Colors.badgeLevel} />
                <Title size="small" style={styles.analyticsValue}>
                  {analyticsData.availableStages}
                </Title>
                <Body style={styles.analyticsLabel}>
                  {t("profile.availableStages")}
                </Body>
              </View>
            </View>

            {/* Stage Analytics Section */}
            {stageAnalytics.length > 0 && (
              <View style={styles.stageAnalyticsSection}>
                <Title size="medium" style={styles.sectionTitle}>
                  {t("profile.stageProgress")}
                </Title>

                {stageAnalytics.map((stage) => {
                  const isCompleted = stage.completedExercises === stage.totalExercises && stage.totalExercises > 0;
                  
                  return (
                    <View key={stage.stageId} style={styles.stageRow}>
                      {/* Stage Number Badge */}
                      <View style={styles.stageBadge}>
                        <Body style={styles.stageBadgeText}>
                          {stage.stageOrder}
                        </Body>
                      </View>

                      {/* Circular Progress with text below */}
                      <View style={styles.progressSection}>
                        <CircularProgress
                          progress={stage.correctPercentage}
                          size={70}
                          strokeWidth={6}
                        />
                        <Body style={styles.progressText}>
                          {stage.correctAnswers} {t("profile.of")} {stage.completedExercises} {t("profile.correct")}
                        </Body>
                      </View>

                      {/* Completed Badge */}
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                          <Body style={styles.completedText}>
                            {t("profile.completed")}
                          </Body>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
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
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    textAlign: "center",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.padding.lg,
    paddingBottom: Spacing.margin.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
    paddingVertical: Spacing.padding.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
    paddingVertical: Spacing.padding.xxl,
    gap: Spacing.gap.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.lg,
    textAlign: "center",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.gap.md,
    marginTop: Spacing.margin.lg,
  },
  analyticsCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.xl,
    padding: Spacing.padding.lg,
    borderWidth: Spacing.borderWidth.medium,
    borderBottomWidth: Spacing.borderWidth.xxthick,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.gap.sm,
    ...Spacing.shadow.large,
  },
  analyticsValue: {
    color: Colors.textPrimary,
    marginTop: Spacing.margin.xs,
  },
  analyticsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  bottomSpacer: {
    height: Spacing.margin.xxxl,
  },
  stageAnalyticsSection: {
    marginTop: Spacing.margin.xxl,
    gap: Spacing.gap.md,
  },
  sectionTitle: {
    marginBottom: Spacing.margin.md,
    color: Colors.textPrimary,
  },
  stageRow: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.xl,
    padding: Spacing.padding.lg,
    borderWidth: Spacing.borderWidth.medium,
    borderBottomWidth: Spacing.borderWidth.thick,
    borderColor: Colors.borderDark,
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.gap.lg,
    ...Spacing.shadow.medium,
  },
  stageBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.badgeLevel,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.accentBlue,
    justifyContent: "center",
    alignItems: "center",
    ...Spacing.shadow.small,
  },
  stageBadgeText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "bold",
    color: Colors.textWhite,
  },
  progressSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.gap.xs,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.margin.xs,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.gap.xs,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.padding.md,
    paddingVertical: Spacing.padding.sm,
    borderRadius: Spacing.radius.lg,
    borderWidth: Spacing.borderWidth.thin,
    borderColor: Colors.success,
  },
  completedText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: "600",
  },
});

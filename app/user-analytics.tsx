import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../components/layout/PageContainer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Body, Title } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import app from "../lib/feathers/feathers-client";
import { useTranslation } from "../lib/localization";
import { useAuthStore } from "../lib/store/auth-store";

interface UserAnalyticsResult {
  totalAnswers: number;
  currentStageOrder: number;
  stages: {
    stageId: string;
    stageOrder: number;
    answerCount: number;
    exercises: {
      type: string;
      avgTryCount: number;
    }[];
  }[];
}

export default function UserAnalytics() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [analytics, setAnalytics] = useState<UserAnalyticsResult | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!user?._id) return;

    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const userId = typeof user._id === 'string' ? user._id : String(user._id);
      const data = await app.service('analytics').get(userId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch user analytics:', err);
      setError(t('errors.generic'));
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
            {/* Analytics Summary Cards */}
            <View style={styles.cardsContainer}>
              <View style={[styles.analyticsCard, { borderColor: Colors.accentBlue }]}>
                <Ionicons name="checkbox-outline" size={32} color={Colors.accentBlue} />
                <Title size="small" style={styles.analyticsValue}>
                  {analytics?.totalAnswers || 0}
                </Title>
                <Body style={styles.analyticsLabel}>{t("profile.totalAnswers")}</Body>
              </View>

              <View style={[styles.analyticsCard, { borderColor: Colors.badgeLevel }]}>
                <Ionicons name="map-outline" size={32} color={Colors.badgeLevel} />
                <Title size="small" style={styles.analyticsValue}>
                  {analytics?.currentStageOrder || 1}
                </Title>
                <Body style={styles.analyticsLabel}>{t("profile.currentStage")}</Body>
              </View>
            </View>

            {/* Stage-by-Stage Accordion */}
            <View style={styles.accordionContainer}>
              <Title size="medium" style={styles.sectionTitle}>
                {t("profile.stageDetails")}
              </Title>

              {analytics?.stages.map((stage) => {
                const isExpanded = expandedStage === stage.stageId;
                
                return (
                  <View key={stage.stageId} style={styles.accordionItem}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setExpandedStage(isExpanded ? null : stage.stageId)}
                      style={[
                        styles.accordionHeader,
                        isExpanded && styles.accordionHeaderActive
                      ]}
                    >
                      <View style={styles.accordionTitleRow}>
                        <View style={styles.stageNumberBadge}>
                          <Body weight="bold" style={styles.stageNumberText}>
                            {stage.stageOrder}
                          </Body>
                        </View>
                        <View style={styles.stageSummaryInfo}>
                          <Body weight="bold" style={styles.stageTitleText}>
                            {t("answers.stage")} {stage.stageOrder}
                          </Body>
                          <Body size="small" style={styles.answerCountText}>
                            {stage.answerCount} {t("profile.totalAnswers")}
                          </Body>
                        </View>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={24} 
                          color={Colors.textSecondary} 
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.accordionContent}>
                        {stage.exercises.length > 0 ? (
                          stage.exercises.map((ex, idx) => (
                            <View key={idx} style={styles.exerciseTypeRow}>
                              <Ionicons 
                                name={
                                  ex.type === 'shape_match' ? 'shapes-outline' :
                                  ex.type === 'odd_one_out' ? 'help-circle-outline' :
                                  'musical-notes-outline'
                                } 
                                size={24} 
                                color={Colors.accentBlue} 
                                style={styles.exerciseIcon}
                              />
                              <View style={styles.exerciseTextColumn}>
                                <Body style={styles.exerciseTypeText}>
                                  {t(`exercise.${ex.type}`)}
                                </Body>
                                <View style={styles.tryCountRow}>
                                  <Body size="small" style={styles.tryCountLabel}>
                                    {t("profile.avgTries")}:{" "}
                                  </Body>
                                  <Body weight="bold" style={styles.tryCountValue}>
                                    {ex.avgTryCount}
                                  </Body>
                                </View>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Body style={styles.noDataText}>{t("profile.noExerciseData")}</Body>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
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
    fontSize: Typography.fontSize.xl,
  },
  analyticsLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  accordionContainer: {
    marginTop: Spacing.margin.xl,
    paddingBottom: Spacing.margin.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.margin.md,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.secondary,
    fontWeight: "500",
  },
  accordionItem: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.lg,
    marginBottom: Spacing.margin.sm,
    borderWidth: Spacing.borderWidth.thin,
    borderColor: Colors.borderDark,
    overflow: "hidden",
    ...Spacing.shadow.small,
  },
  accordionHeader: {
    padding: Spacing.padding.md,
    backgroundColor: Colors.backgroundLight,
  },
  accordionHeaderActive: {
    backgroundColor: Colors.backgroundDark,
    borderBottomWidth: Spacing.borderWidth.thin,
    borderBottomColor: Colors.border,
  },
  accordionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stageNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.margin.md,
  },
  stageNumberText: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.md,
    fontWeight: "bold",
  },
  stageSummaryInfo: {
    flex: 1,
  },
  stageTitleText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  answerCountText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  accordionContent: {
    padding: Spacing.padding.md,
    backgroundColor: Colors.backgroundLight,
    gap: Spacing.padding.sm,
  },
  exerciseTypeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.gap.md,
  },
  exerciseIcon: {
    marginTop: 2,
  },
  exerciseTextColumn: {
    flex: 1,
    gap: 2,
  },
  exerciseTypeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  tryCountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tryCountValue: {
    color: Colors.secondary,
    fontSize: Typography.fontSize.md,
    fontWeight: "bold",
  },
  tryCountLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  noDataText: {
    textAlign: "center",
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
  bottomSpacer: {
    height: Spacing.margin.xxxl,
  },
});

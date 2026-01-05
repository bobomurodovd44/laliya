import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { FloatingShapesBackground } from "../components/layout/FloatingShapesBackground";
import { PageContainer } from "../components/layout/PageContainer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Body } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import { exercises } from "../data/data";
import { fetchStages, Stage } from "../lib/api/stages";
import { getCachedExercises } from "../lib/cache/exercises-cache";
import { getCachedStages, setCachedStages } from "../lib/cache/stages-cache";
import { imagePreloader } from "../lib/image-preloader";
import { useAuthStore } from "../lib/store/auth-store";
import {
  getUserMaxStageOrder,
  isStageAccessible,
} from "../lib/utils/stage-access";

interface LessonCard {
  order: number;
  positionStyle: any;
  isActive?: boolean;
  exerciseCount: number;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxStageOrder, setMaxStageOrder] = useState<number>(0);
  const [loadingStageAccess, setLoadingStageAccess] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  //
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

  const verticalSpacing = 160;
  const cardSize = 135;
  const halfCard = cardSize / 2;

  // Fetch user's max stage order
  useEffect(() => {
    const loadStageAccess = async () => {
      try {
        setLoadingStageAccess(true);
        const currentOrder = await getUserMaxStageOrder(user?.currentStageId);

        // Level should only increase, never decrease
        // Use the maximum between current order and existing maxStageOrder
        setMaxStageOrder((prevMax) => {
          // If we have a valid current order, use the maximum
          // This ensures level never decreases
          return Math.max(prevMax, currentOrder);
        });
      } catch (err) {
        // On error, don't decrease the level - keep current maxStageOrder
        // Only set to 0 if we don't have a previous value
        setMaxStageOrder((prevMax) => prevMax || 0);
      } finally {
        setLoadingStageAccess(false);
      }
    };

    if (user) {
      loadStageAccess();
    } else {
      setMaxStageOrder(0);
      setLoadingStageAccess(false);
    }
  }, [user?.currentStageId]);

  // Refresh level in background when page is focused
  useFocusEffect(
    useCallback(() => {
      // Refresh level in background when page is focused
      if (user?.currentStageId) {
        getUserMaxStageOrder(user.currentStageId)
          .then((currentOrder) => {
            // Level should only increase, never decrease
            setMaxStageOrder((prevMax) => Math.max(prevMax, currentOrder));
          })
          .catch(() => {
            // On error, don't change the level
          });
      }
    }, [user?.currentStageId])
  );

  // Load stages function (reusable for both initial load and refresh)
  const loadStages = useCallback(async (skipCache = false) => {
    try {
      if (!skipCache) {
        // Check cache first (only on initial load)
        const cachedStages = getCachedStages();
        if (cachedStages) {
          // Use cached data - no loading needed
          setStages(cachedStages);
          setLoading(false);
          setError(null);
          return;
        }
      }

      // No cache or refresh - fetch from API
      if (!skipCache) {
        setLoading(true);
      }
      setError(null);
      const stagesData = await fetchStages();

      // Cache the stages
      setCachedStages(stagesData);

      setStages(stagesData);
    } catch (err: any) {
      setError(err.message || "Failed to load stages");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch stages from backend (initial load)
  useEffect(() => {
    loadStages();
  }, [loadStages]);

  // Refresh handler for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh stages (skip cache)
    await loadStages(true);
    // Also refresh stage access level
    if (user?.currentStageId) {
      try {
        const currentOrder = await getUserMaxStageOrder(user.currentStageId);
        setMaxStageOrder((prevMax) => Math.max(prevMax, currentOrder));
      } catch (err) {
        // On error, don't change the level
      }
    }
  }, [loadStages, user?.currentStageId]);

  const lessons: (LessonCard & { stageId: string })[] = useMemo(() => {
    return stages.map((stage, index) => {
      const isAccessible = isStageAccessible(stage, maxStageOrder);
      return {
        order: stage.order,
        stageId: stage._id,
        positionStyle:
          index % 2 === 0
            ? { top: 20 + index * verticalSpacing, right: "5%" }
            : { top: 20 + index * verticalSpacing, left: "8%" },
        isActive: isAccessible, // Only accessible stages are active
        exerciseCount:
          stage.numberOfExercises ??
          exercises.filter((ex) => ex.stageId === stage.order).length,
        theme: stageThemes[index % stageThemes.length],
      };
    });
  }, [stages, stageThemes, exercises, maxStageOrder]);

  // Handler to navigate to task page
  const handleStagePress = useCallback(
    (stageId: string) => {
      // Find the lesson to check exercise count and access
      const lesson = lessons.find((l) => l.stageId === stageId);

      // Only navigate if the stage has exercises and is accessible
      if (!lesson || lesson.exerciseCount === 0 || !lesson.isActive) {
        return;
      }

      // Navigate IMMEDIATELY - don't wait for anything
      router.push(`/task?stageId=${stageId}&exerciseOrder=1`);

      // Preload exercises and images in background (fire and forget)
      const cached = getCachedExercises(stageId);

      if (!cached) {
        // Fetch exercises and cache images in background
        (async () => {
          try {
            const { fetchExercisesByStageId, mapPopulatedExerciseToExercise } =
              await import("../lib/api/exercises");
            const apiExercises = await fetchExercisesByStageId(stageId);

            // Map exercises
            const mappedExercises = apiExercises.map(
              (apiEx) => mapPopulatedExerciseToExercise(apiEx).exercise
            );

            // Cache exercises
            const { setCachedExercises } = await import(
              "../lib/cache/exercises-cache"
            );
            setCachedExercises(stageId, mappedExercises, apiExercises);

            // Extract and preload all images
            const imageUrls: string[] = [];
            apiExercises.forEach((apiExercise) => {
              apiExercise.options?.forEach((option) => {
                if (option.img?.name && option.img.name.trim() !== "") {
                  imageUrls.push(option.img.name);
                }
              });
              if (
                apiExercise.answer?.img?.name &&
                apiExercise.answer.img.name.trim() !== ""
              ) {
                imageUrls.push(apiExercise.answer.img.name);
              }
            });

            // Preload images in background (don't wait)
            if (imageUrls.length > 0) {
              const uniqueUrls = Array.from(new Set(imageUrls));
              imagePreloader.preloadBatch(uniqueUrls, "high").catch((err) => {
                console.error("Failed to preload images:", err);
              });
            }
          } catch (err) {
            console.error("Failed to preload exercises:", err);
          }
        })();
      } else {
        // Exercises cached, but ensure images are preloaded in background
        imagePreloader.preloadStage(stageId).catch(() => {});
      }
    },
    [lessons, router]
  );

  const { width: screenWidth } = useWindowDimensions();

  // Helper to get coordinates
  const getCardCoordinates = (lesson: LessonCard) => {
    let x = 0;
    const y = (lesson.positionStyle.top as number) + halfCard;

    if ("left" in lesson.positionStyle) {
      const leftVal = lesson.positionStyle.left;
      if (typeof leftVal === "string" && leftVal.includes("%")) {
        const pct = parseFloat(leftVal) / 100;
        x = screenWidth * pct + halfCard;
      } else {
        x = (leftVal as number) + halfCard;
      }
    } else if ("right" in lesson.positionStyle) {
      const rightVal = lesson.positionStyle.right;
      if (typeof rightVal === "string" && rightVal.includes("%")) {
        const pct = parseFloat(rightVal) / 100;
        x = screenWidth - screenWidth * pct - halfCard;
      } else {
        x = screenWidth - (rightVal as number) - halfCard;
      }
    } else if (lesson.positionStyle.alignSelf === "center") {
      x = screenWidth / 2;
    }

    return { x, y };
  };

  // Generate Path
  const generatePath = () => {
    if (lessons.length < 2) return "";

    let d = "";
    const coords = lessons.map(getCardCoordinates);
    const offset = 72; // Distance from center to start/end drawing (67.5 radius + 4.5 gap)

    for (let i = 0; i < coords.length - 1; i++) {
      const current = coords[i];
      const next = coords[i + 1];

      // Calculate direction vector
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) continue;

      const ux = dx / dist;
      const uy = dy / dist;

      // Start/End points offset from center
      const sx = current.x + ux * offset;
      const sy = current.y + uy * offset;
      const ex = next.x - ux * offset;
      const ey = next.y - uy * offset;

      // Control points for smooth curve between new start/end
      const cp1y = sy + (ey - sy) / 2;
      const cp2y = ey - (ey - sy) / 2;

      d += `M ${sx} ${sy} C ${sx} ${cp1y}, ${ex} ${cp2y}, ${ex} ${ey} `;
    }

    return d;
  };

  return (
    <PageContainer>
      <FloatingShapesBackground />

      {/* Decorative dots only */}
      <View style={styles.decorativeElements}>
        <View style={styles.pathDot1} />
        <View style={styles.pathDot2} />
        <View style={styles.pathDot3} />
        <View style={styles.pathDot4} />
      </View>

      <View style={[styles.fixedHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerStarsContainer}>
          <View style={styles.starBadge}>
            <Ionicons name="star" size={28} color={Colors.badgeStar} />
            <Body style={styles.starCount} weight="bold">
              {user?.score?.toLocaleString() || "0"}
            </Body>
          </View>
        </View>
        <View style={styles.levelBadge}>
          <View style={styles.levelBadgeContent}>
            <Ionicons
              name="trophy"
              size={20}
              color={Colors.badgeLevel}
              style={{ marginRight: Spacing.margin.xs }}
            />
            <Body style={styles.levelText} weight="bold">
              {maxStageOrder || 0}
            </Body>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressViewOffset={insets.top + 90}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner message="Loading stages..." size="large" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Body style={styles.errorText}>{error}</Body>
          </View>
        ) : lessons.length === 0 ? (
          <View style={styles.errorContainer}>
            <Body style={styles.errorText}>No stages available</Body>
          </View>
        ) : (
          <>
            {/* Lesson Cards in Path Layout */}
            <View
              style={[
                styles.pathContainer,
                {
                  height: Math.max(lessons.length * verticalSpacing + 260, 720),
                },
              ]}
            >
              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                <Path
                  d={generatePath()}
                  stroke={Colors.border}
                  strokeWidth="20"
                  strokeDasharray="0, 28"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.85}
                />
              </Svg>

              {lessons.map((lesson) => (
                <View
                  key={lesson.order}
                  style={[styles.cardWrapper, lesson.positionStyle]}
                >
                  <TouchableOpacity
                    style={styles.lessonCardOuter}
                    onPress={() => handleStagePress(lesson.stageId)}
                    activeOpacity={lesson.isActive ? 0.85 : 1}
                    disabled={!lesson.isActive}
                  >
                    {lesson.isActive ? (
                      <LinearGradient
                        colors={[lesson.theme.primary, lesson.theme.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.lessonCard, styles.lessonCardActive]}
                      >
                        <Body style={styles.stageOrderText} weight="bold">
                          {lesson.order}
                        </Body>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[styles.lessonCard, styles.lessonCardDisabled]}
                      >
                        <Body style={styles.stageOrderText} weight="bold">
                          {lesson.order}
                        </Body>
                        <View style={styles.lockIconContainer}>
                          <Ionicons
                            name="lock-closed"
                            size={24}
                            color="#FFFFFF"
                            style={styles.lockIcon}
                          />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  pathDot1: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.shapeGreen,
    top: 130,
    left: "22%",
    opacity: 0.4,
  },
  pathDot2: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.shapePink,
    top: 250,
    right: "28%",
    opacity: 0.4,
  },
  pathDot3: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.shapeYellow,
    top: 420,
    left: "45%",
    opacity: 0.4,
  },
  pathDot4: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.shapeBlue,
    top: 540,
    left: "30%",
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.padding.lg,
    paddingBottom: Spacing.margin.xxxl,
  },
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
    borderBottomWidth: Spacing.borderWidth.thin,
    borderBottomColor: Colors.borderLight,
  },
  headerStarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.badgeStarBg,
    paddingHorizontal: Spacing.padding.lg,
    paddingVertical: Spacing.padding.md,
    borderRadius: Spacing.radius.xxl,
  },
  starCount: {
    fontSize: Typography.fontSize.xxl,
    color: Colors.secondary,
    marginLeft: Spacing.margin.sm,
  },
  levelBadge: {
    backgroundColor: Colors.badgeLevelBg,
    paddingHorizontal: Spacing.padding.lg,
    paddingVertical: Spacing.padding.md,
    borderRadius: Spacing.radius.xl,
  },
  levelBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.badgeLevel,
  },
  pathContainer: {
    position: "relative",
    marginTop: Spacing.margin.xl,
  },
  cardWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  lessonCardOuter: {
    borderRadius: Spacing.radius.xxl,
    ...Spacing.shadow.xlarge,
  },
  lessonCard: {
    width: 135,
    height: 135,
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.xxl,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.padding.md,
    overflow: "hidden",
  },
  lessonCardActive: {
    borderColor: Colors.backgroundLight,
    borderWidth: Spacing.borderWidth.xthick,
  },
  lessonCardDisabled: {
    backgroundColor: "#808080",
  },
  lessonCardNavigating: {
    opacity: 0.7,
  },
  lockIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    padding: 4,
  },
  lockIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardInnerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFE6F0",
    opacity: 0.3,
    borderRadius: 20,
  },
  lessonNumber: {
    fontFamily: "FredokaOne",
    fontSize: 52,
    color: "#E0E0E0",
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.05)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  lessonNumberActive: {
    color: "#C0C0C0",
  },
  starContainer: {
    flexDirection: "row",
    gap: 2,
  },
  lessonTitle: {
    fontFamily: "BalsamiqSans",
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginTop: 12,
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
  },
  stageOrderText: {
    fontSize: 56,
    fontFamily: "FredokaOne",
    color: "#FFFFFF",
    fontWeight: "400",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: -1,
  },
  lessonHeaderRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stageBadgeText: {
    fontFamily: "BalsamiqSans",
    fontSize: 13,
    color: "#333",
  },
  exCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exCountText: {
    color: "#fff",
    fontFamily: "BalsamiqSans",
    fontSize: 12,
  },
  cardFooter: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  cardFooterText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: "FredokaOne",
    fontSize: 16,
    color: "#fff",
  },
  cardSubtitle: {
    fontFamily: "BalsamiqSans",
    fontSize: 12,
    color: "#fdfdfd",
  },
  bottomSpacer: {
    height: Spacing.margin.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.padding.xxl,
    minHeight: 400,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.padding.xxl,
    minHeight: 400,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.lg,
    textAlign: "center",
    paddingHorizontal: Spacing.padding.lg,
  },
});

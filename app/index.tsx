import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
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
import { Body } from "../components/Typography";
import { Colors, Spacing, Typography } from "../constants";
import { exercises } from "../data/data";
import { fetchStages, Stage } from "../lib/api/stages";

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
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotAnim, {
          toValue: -10,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(mascotAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [mascotAnim]);

  // Fetch stages from backend
  useEffect(() => {
    const loadStages = async () => {
      try {
        setLoading(true);
        setError(null);
        const stagesData = await fetchStages();
        setStages(stagesData);
      } catch (err: any) {
        setError(err.message || "Failed to load stages");
      } finally {
        setLoading(false);
      }
    };

    loadStages();
  }, []);

  const lessons: (LessonCard & { stageId: string })[] = useMemo(() => {
    return stages.map((stage, index) => ({
      order: stage.order,
      stageId: stage._id,
      positionStyle:
        index % 2 === 0
          ? { top: 20 + index * verticalSpacing, right: "5%" }
          : { top: 20 + index * verticalSpacing, left: "8%" },
      isActive: true, // All stages are available
      exerciseCount:
        stage.numberOfExercises ??
        exercises.filter((ex) => ex.stageId === stage.order).length,
      theme: stageThemes[index % stageThemes.length],
    }));
  }, [stages, stageThemes, exercises]);

  // Handler to navigate to task page
  const handleStagePress = (stageId: string) => {
    // Navigate to task page with stage._id (ObjectId string)
    router.push(`/task?stageId=${stageId}&exerciseOrder=1`);
  };

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
              1,240
            </Body>
          </View>
        </View>
        <View style={styles.levelBadge}>
          <Body style={styles.levelText} weight="bold">
            Level 3
          </Body>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Body style={styles.loadingText}>Loading stages...</Body>
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
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[lesson.theme.primary, lesson.theme.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.lessonCard,
                        lesson.isActive && styles.lessonCardActive,
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.mascotInCard,
                          { transform: [{ translateY: mascotAnim }] },
                        ]}
                      >
                        <Image
                          source={require("../assets/parrot.png")}
                          style={styles.mascotImage}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </LinearGradient>
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
  mascotInCard: {
    width: 80,
    height: 80,
    marginBottom: 0,
  },
  mascotContainer: {
    position: "absolute",
    top: -70,
    right: -40,
    width: 80,
    height: 80,
  },
  mascotImage: {
    width: "100%",
    height: "100%",
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
  loadingText: {
    marginTop: Spacing.margin.md,
    color: Colors.secondary,
    fontSize: Typography.fontSize.lg,
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

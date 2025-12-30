import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { exercises, stages } from "../data/data";

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

  // Animated shapes
  const shape1Anim = useRef(new Animated.Value(0)).current;
  const shape2Anim = useRef(new Animated.Value(0)).current;
  const shape3Anim = useRef(new Animated.Value(0)).current;
  const shape4Anim = useRef(new Animated.Value(0)).current;
  const shape5Anim = useRef(new Animated.Value(0)).current;

  const stageThemes = [
    { primary: "#FF9F1C", secondary: "#FFD6A5", accent: "#FFF3D9" },
    { primary: "#6C63FF", secondary: "#A29BFE", accent: "#ECE9FF" },
    { primary: "#2ED573", secondary: "#7BED9F", accent: "#E9FFF1" },
    { primary: "#FF6B6B", secondary: "#FFA8A8", accent: "#FFECEC" },
    { primary: "#1CB0F6", secondary: "#6DD5FA", accent: "#E4F7FF" },
  ];

  const verticalSpacing = 160;
  const cardSize = 135;
  const halfCard = cardSize / 2;

  // Animate mascot bouncing
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

    // Animate floating shapes
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape1Anim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(shape1Anim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shape2Anim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(shape2Anim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shape3Anim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(shape3Anim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shape4Anim, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
        }),
        Animated.timing(shape4Anim, {
          toValue: 0,
          duration: 4500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shape5Anim, {
          toValue: 1,
          duration: 5500,
          useNativeDriver: true,
        }),
        Animated.timing(shape5Anim, {
          toValue: 0,
          duration: 5500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const lessons: LessonCard[] = stages.map((stage, index) => ({
    order: stage.order,
    positionStyle:
      index % 2 === 0
        ? { top: 20 + index * verticalSpacing, right: "5%" }
        : { top: 20 + index * verticalSpacing, left: "8%" },
    isActive: true, // All stages are available
    exerciseCount: exercises.filter((ex) => ex.stageId === stage.order).length,
    theme: stageThemes[index % stageThemes.length],
  }));

  // Handler to navigate to task page only if exercises exist
  const handleStagePress = (stageId: number) => {
    const stageExercises = exercises.filter((ex) => ex.stageId === stageId);
    if (stageExercises.length > 0) {
      router.push(`/task?stageId=${stageId}&exerciseOrder=1`);
    }
    // If no exercises, do nothing
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
    <View style={styles.container}>
      {/* Simple Light Background */}
      <View style={styles.backgroundLayer} />

      {/* Animated Floating Shapes */}
      <View style={styles.animatedShapesContainer}>
        <Animated.View
          style={[
            styles.floatingShape,
            styles.circle1,
            {
              transform: [
                {
                  translateY: shape1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30],
                  }),
                },
                {
                  translateX: shape1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.floatingShape,
            styles.square1,
            {
              transform: [
                {
                  translateY: shape2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
                  }),
                },
                {
                  rotate: shape2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.floatingShape,
            styles.circle2,
            {
              transform: [
                {
                  translateY: shape3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
                {
                  scale: shape3Anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.1, 1],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.floatingShape,
            styles.square2,
            {
              transform: [
                {
                  translateY: shape4Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 35],
                  }),
                },
                {
                  translateX: shape4Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -25],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.floatingShape,
            styles.circle3,
            {
              transform: [
                {
                  translateY: shape5Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -45],
                  }),
                },
                {
                  rotate: shape5Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "-180deg"],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      {/* Decorative dots only */}
      <View style={styles.decorativeElements}>
        <View style={styles.pathDot1} />
        <View style={styles.pathDot2} />
        <View style={styles.pathDot3} />
        <View style={styles.pathDot4} />
      </View>

      {/* Fixed Header at Top */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerStarsContainer}>
          <View style={styles.starBadge}>
            <Ionicons name="star" size={28} color="#FFD700" />
            <Text style={styles.starCount}>1,240</Text>
          </View>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Level 3</Text>
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
        {/* Lesson Cards in Path Layout */}
        <View
          style={[
            styles.pathContainer,
            { height: Math.max(lessons.length * verticalSpacing + 260, 720) },
          ]}
        >
          {/* Svg Dotted Path */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path
              d={generatePath()}
              stroke="#D1D5DB" // Medium gray for better visibility
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
                onPress={() => handleStagePress(lesson.order)}
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

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5E8",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFF5E8",
  },
  animatedShapesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  floatingShape: {
    position: "absolute",
  },
  circle1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFD4E5",
    opacity: 0.3,
    top: 100,
    left: "10%",
  },
  square1: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: "#D4E4FF",
    opacity: 0.25,
    top: 200,
    right: "15%",
  },
  circle2: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFE4B8",
    opacity: 0.2,
    top: 450,
    left: "60%",
  },
  square2: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#B8E6B8",
    opacity: 0.25,
    top: 600,
    left: "8%",
  },
  circle3: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8D4FF",
    opacity: 0.2,
    top: 800,
    right: "12%",
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  pathDot1: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#B8E6B8",
    top: 130,
    left: "22%",
    opacity: 0.4,
  },
  pathDot2: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFD4E5",
    top: 250,
    right: "28%",
    opacity: 0.4,
  },
  pathDot3: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFE4B8",
    top: 420,
    left: "45%",
    opacity: 0.4,
  },
  pathDot4: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D4E4FF",
    top: 540,
    left: "30%",
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerStarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  starCount: {
    fontFamily: "BalsamiqSans",
    fontSize: 22,
    fontWeight: "700",
    color: "#FF8C00",
    marginLeft: 8,
  },
  levelBadge: {
    backgroundColor: "#E6F2FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  levelText: {
    fontFamily: "BalsamiqSans",
    fontSize: 18,
    fontWeight: "700",
    color: "#4A90E2",
  },
  pathContainer: {
    position: "relative",
    marginTop: 20,
  },
  cardWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  lessonCardOuter: {
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
  },
  lessonCard: {
    width: 135,
    height: 135,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    overflow: "hidden",
  },
  lessonCardActive: {
    borderColor: "#FFFFFF",
    borderWidth: 4,
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
    height: 40,
  },
});

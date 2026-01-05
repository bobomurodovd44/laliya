import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../constants/Colors";
import { Spacing } from "../constants/Spacing";
import { Typography } from "../constants/Typography";

interface KeepGoingCelebrationProps {
  visible: boolean;
}

export default function KeepGoingCelebration({
  visible,
}: KeepGoingCelebrationProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Simple fade in
      opacity.value = withTiming(1, { duration: 200 });
      // Fade out after 1.2 seconds
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
      }, 1200);
    } else {
      opacity.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="star" size={64} color={Colors.textWhite} />
          </View>
        </View>
        <Text style={styles.title}>Keep Going!</Text>
        <Text style={styles.subtitle}>You're doing great!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.xxl,
    padding: Spacing.padding.xxl,
    paddingVertical: Spacing.padding.xxxl,
    alignItems: "center",
    ...Spacing.shadow.xlarge,
    borderWidth: Spacing.borderWidth.thick,
    borderColor: Colors.warning,
    minWidth: 280,
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: Spacing.margin.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.warning,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.huge,
    color: Colors.textPrimary,
    marginTop: Spacing.margin.md,
    textAlign: "center",
    letterSpacing: Typography.letterSpacing.normal,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.secondary,
    fontSize: Typography.fontSize.xxxl,
    color: Colors.secondary,
    marginTop: Spacing.margin.sm,
    textAlign: "center",
    lineHeight: Typography.fontSize.xxxl * Typography.lineHeight.normal,
  },
});

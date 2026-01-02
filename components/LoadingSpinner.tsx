import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Body } from "./Typography";
import { Colors, Spacing } from "../constants";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
}

export function LoadingSpinner({
  message,
  size = "large",
}: LoadingSpinnerProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    // Smooth pulsing animation
    scale.value = withRepeat(
      withTiming(1.15, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const indicatorSize = size === "large" ? "large" : "small";
  const indicatorColor = Colors.primary;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinnerContainer, animatedStyle]}>
        <ActivityIndicator size={indicatorSize} color={indicatorColor} />
      </Animated.View>
      {message && <Body style={styles.message}>{message}</Body>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    padding: Spacing.padding.md,
  },
  message: {
    marginTop: Spacing.margin.lg,
    color: Colors.textSecondary,
    fontSize: 18,
    textAlign: "center",
  },
});


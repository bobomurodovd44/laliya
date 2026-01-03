import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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
        <Ionicons name="star" size={48} color="#FFA500" />
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
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#FFA500",
    minWidth: 200,
  },
  title: {
    fontFamily: "FredokaOne",
    fontSize: 32,
    color: "#FFA500",
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "BalsamiqSans",
    fontSize: 18,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
});

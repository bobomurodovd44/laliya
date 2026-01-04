import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors, Spacing } from "../constants";

interface StarRatingProps {
  value: number | null; // 0-5 or null (null/undefined treated as 0)
  onChange: (value: number) => void;
  size?: number; // Optional size for stars
  disabled?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 40,
  disabled = false,
}: StarRatingProps) {
  const handleStarPress = (rating: number) => {
    if (!disabled) {
      // If clicking the same star that's already selected, set to 0
      const currentValue = value ?? 0;
      const newValue = currentValue === rating ? 0 : rating;
      onChange(newValue);
    }
  };

  // Treat null/undefined as 0
  const currentValue = value ?? 0;

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= currentValue;
        return (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            disabled={disabled}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Ionicons
              name={isFilled ? "star" : "star-outline"}
              size={size}
              color={isFilled ? Colors.secondary : Colors.textTertiary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.margin.sm,
  },
  starButton: {
    padding: Spacing.padding.xs,
  },
});


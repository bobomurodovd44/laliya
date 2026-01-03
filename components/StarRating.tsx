import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors, Spacing } from "../constants";

interface StarRatingProps {
  value: number | null; // 1-5 or null
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
      onChange(rating);
    }
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = value !== null && star <= value;
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
              color={isFilled ? Colors.badgeLevel : Colors.textTertiary}
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


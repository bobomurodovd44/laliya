import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../constants';

interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  iconColor?: string;
  iconSize?: number;
}

export const BackButton = React.memo<BackButtonProps>(
  ({ onPress, style, iconColor = Colors.textPrimary, iconSize = 28 }) => {
    const router = useRouter();

    const handlePress = useCallback(() => {
      if (onPress) {
        onPress();
      } else {
        router.back();
      }
    }, [onPress, router]);

    return (
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
      </TouchableOpacity>
    );
  }
);

BackButton.displayName = 'BackButton';

const styles = StyleSheet.create({
  button: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Spacing.shadow.small,
  },
});



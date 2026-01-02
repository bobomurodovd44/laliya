import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../constants';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar = React.memo<ProgressBarProps>(
  ({
    progress,
    height = 12,
    color = Colors.progressFill,
    backgroundColor = Colors.progressBackground,
    animated = true,
    style,
  }) => {
    const progressAnim = useSharedValue(progress);

    React.useEffect(() => {
      if (animated) {
        progressAnim.value = withTiming(progress, { duration: 400 });
      } else {
        progressAnim.value = progress;
      }
    }, [progress, animated, progressAnim]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        width: `${progressAnim.value * 100}%`,
      };
    });

    return (
      <View
        style={[
          styles.container,
          { height, backgroundColor },
          style,
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            { height, backgroundColor: color },
            animatedStyle,
          ]}
        />
      </View>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.radius.sm,
    overflow: 'hidden',
    ...Spacing.shadow.small,
    borderWidth: Spacing.borderWidth.thin,
    borderColor: Colors.borderLight,
  },
  fill: {
    borderRadius: Spacing.radius.sm,
  },
});



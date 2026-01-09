import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants';
import { Body, Title } from './Typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
}

export const CircularProgress = React.memo<CircularProgressProps>(
  ({ progress, size = 80, strokeWidth = 8, showPercentage = true }) => {
    const progressAnim = useSharedValue(0);
    
    // Calculate radius and circumference
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Determine color based on percentage
    const getProgressColor = (percent: number): string => {
      if (percent >= 70) return Colors.success; // Green
      if (percent >= 40) return Colors.secondary; // Orange
      return Colors.error; // Red
    };

    const progressColor = getProgressColor(progress);

    useEffect(() => {
      progressAnim.value = withTiming(progress, { duration: 800 });
    }, [progress, progressAnim]);

    const animatedProps = useAnimatedProps(() => {
      const strokeDashoffset =
        circumference - (progressAnim.value / 100) * circumference;
      return {
        strokeDashoffset,
      };
    });

    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.borderLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedProps}
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        </Svg>
        {showPercentage && (
          <View style={styles.textContainer}>
            <Body style={[styles.percentageText, { color: progressColor }]}>
              {Math.round(progress)}%
            </Body>
          </View>
        )}
      </View>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontWeight: 'bold',
  },
});

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Random number generator within a range
const random = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

type ShapeType = 'circle' | 'square' | 'star';

interface AnimatedShapeProps {
  delay?: number;
  size?: number;
  color?: string;
  initialX?: number;
  initialY?: number;
  type?: ShapeType;
}

// Animated Shape Component
const AnimatedShape = ({ 
  delay = 0, 
  size = 50, 
  color = '#FFD700', 
  initialX = 0, 
  initialY = 0,
  type = 'circle'
}: AnimatedShapeProps) => {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Random movement animation
    translateX.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(initialX + random(-50, 50), { duration: random(3000, 5000), easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX - random(-50, 50), { duration: random(3000, 5000), easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX, { duration: random(3000, 5000), easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));

    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(initialY + random(-50, 50), { duration: random(3000, 5000), easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY - random(-50, 50), { duration: random(3000, 5000), easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY, { duration: random(3000, 5000), easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));

    // Pulse animation
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.2, { duration: random(2000, 4000), easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: random(2000, 4000), easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: random(2000, 4000), easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));

    // Rotation animation
    rotate.value = withDelay(delay, withRepeat(
      withTiming(360, { duration: random(10000, 20000), easing: Easing.linear }),
      -1,
      false
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: 0.3, // More transparent
    };
  });

  const renderShape = () => {
    switch (type) {
      case 'square':
        return <Rect x="0" y="0" width="100" height="100" rx="20" fill={color} />;
      case 'star':
        // Simple star polygon
        return <Polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={color} />;
      case 'circle':
      default:
        return <Circle cx="50" cy="50" r="50" fill={color} />;
    }
  };

  return (
    <Animated.View style={[styles.shapeContainer, animatedStyle]}>
      <Svg height={size} width={size} viewBox="0 0 100 100">
        {renderShape()}
      </Svg>
    </Animated.View>
  );
};

export default function AnimatedBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top Left - Yellow Circle */}
      <AnimatedShape 
        size={80} 
        color="#FFE082" 
        initialX={-20} 
        initialY={-20} 
        delay={0}
        type="circle"
      />
      
      {/* Top Right - Blue Square */}
      <AnimatedShape 
        size={60} 
        color="#90CAF9" 
        initialX={width - 80} 
        initialY={50} 
        delay={1000}
        type="square"
      />
      
      {/* Bottom Left - Green Star */}
      <AnimatedShape 
        size={90} 
        color="#A5D6A7" 
        initialX={-30} 
        initialY={height - 200} 
        delay={500}
        type="star"
      />
      
      {/* Bottom Right - Pink Circle */}
      <AnimatedShape 
        size={70} 
        color="#F48FB1" 
        initialX={width - 90} 
        initialY={height - 150} 
        delay={1500}
        type="circle"
      />
      
      {/* Center - Purple Square (Smaller) */}
      <AnimatedShape 
        size={40} 
        color="#CE93D8" 
        initialX={width / 2 - 20} 
        initialY={height / 2 - 20} 
        delay={2000}
        type="square"
      />

       {/* Extra - Orange Star */}
       <AnimatedShape 
        size={50} 
        color="#FFCC80" 
        initialX={width / 2 + 50} 
        initialY={height / 4} 
        delay={1200}
        type="star"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1, // Ensure it stays behind everything
    backgroundColor: '#FFF8E7', // Light orange/cream background
    overflow: 'hidden',
  },
  shapeContainer: {
    position: 'absolute',
  },
});

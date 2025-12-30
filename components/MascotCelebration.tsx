import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface MascotCelebrationProps {
  visible: boolean;
}

export default function MascotCelebration({ visible }: MascotCelebrationProps) {
  const translateY = useSharedValue(height); // Start off-screen
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Pop up logic
      translateY.value = withSpring(0, { damping: 12 });
      
      // Gentle wobble
      rotate.value = withDelay(300, withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      ));
    } else {
      translateY.value = height; // Reset off-screen
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` }
      ],
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.mascotContainer, animatedStyle]}>
        <Image 
          source={require('../assets/images/icon.png')} 
          style={styles.mascot} 
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-start', // Bottom left corner
    zIndex: 100, // Top of everything
    paddingBottom: -20,
    paddingLeft: -20,
  },
  mascotContainer: {
    width: 200,
    height: 200,
  },
  mascot: {
    width: '100%',
    height: '100%',
  },
});

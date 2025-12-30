import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle
} from 'react-native';

interface DuoButtonProps {
  title: string;
  onPress?: () => void;
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
}

const colorSchemes = {
  green: {
    main: '#58CC02',
    shadow: '#46A302',
  },
  blue: {
    main: '#1CB0F6',
    shadow: '#1899D6',
  },
  red: {
    main: '#FF4B4B',
    shadow: '#E03E3E',
  },
  yellow: {
    main: '#FFC800',
    shadow: '#FFAB00',
  },
  purple: {
    main: '#CE82FF',
    shadow: '#B565E0',
  },
  orange: {
    main: '#FF9600',
    shadow: '#CC6D00',
  },
  gray: {
    main: '#C0C0C0', // Darker gray for better contrast with white text
    shadow: '#A0A0A0',
  },
};

const sizes = {
  small: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    fontSize: 18,
    borderRadius: 20,
    shadowDepth: 6,
  },
  medium: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    fontSize: 22,
    borderRadius: 26,
    shadowDepth: 8,
  },
  large: {
    paddingVertical: 20,
    paddingHorizontal: 56,
    fontSize: 26,
    borderRadius: 32,
    shadowDepth: 10,
  },
};

export function DuoButton({ 
  title, 
  onPress, 
  color = 'green', 
  size = 'medium',
  style,
  disabled = false,
}: DuoButtonProps) {
  const colors = disabled ? colorSchemes.gray : colorSchemes[color];
  const sizeStyle = sizes[size];
  
  // Animation values
  const pressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animate press down
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;

    // Animate press up with bounce
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 12,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 12,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    
    // Light haptic on release
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress?.();
  };

  // Interpolate press animation
  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sizeStyle.shadowDepth - 2],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.6 : 1,
        }
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={styles.pressable}
      >
        {/* Shadow layer */}
        <Animated.View 
          style={[
            styles.shadowLayer,
            {
              backgroundColor: colors.shadow,
              borderRadius: sizeStyle.borderRadius,
              paddingBottom: sizeStyle.shadowDepth,
            }
          ]} 
        >
          {/* Main button */}
          <Animated.View
            style={[
              styles.buttonLayer,
              {
                backgroundColor: colors.main,
                borderRadius: sizeStyle.borderRadius,
                paddingVertical: sizeStyle.paddingVertical,
                paddingHorizontal: sizeStyle.paddingHorizontal,
                transform: [{ translateY }],
              }
            ]}
          >
            {/* Button text */}
            <Text 
              style={[
                styles.text,
                { fontSize: sizeStyle.fontSize }
              ]}
            >
              {title}
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  pressable: {
    width: '100%',
  },
  shadowLayer: {
    width: '100%',
  },
  buttonLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'BalsamiqSans',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    zIndex: 1,
  },
});

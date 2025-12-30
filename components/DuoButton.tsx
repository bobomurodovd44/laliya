import { Ionicons } from '@expo/vector-icons';
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
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  shape?: 'rectangle' | 'circle';
  customSize?: number; // New prop for explicit size (diameter for circles)
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
    main: '#C0C0C0', 
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
  icon,
  iconSize,
  shape = 'rectangle',
  customSize,
}: DuoButtonProps) {
  const colors = disabled ? colorSchemes.gray : colorSchemes[color];
  const sizeStyle = sizes[size];
  
  // Calculate border radius based on shape
  const borderRadius = shape === 'circle' ? 999 : sizeStyle.borderRadius;

  // Determine dimensions if customSize is provided
  // For circles, customSize = diameter of the TOP FACE
  const buttonWidth = customSize ? customSize : (shape === 'circle' ? undefined : '100%');
  // For circles, height of the top face is customSize.
  // The container will be taller by shadowDepth.
  const faceHeight = customSize && shape === 'circle' ? customSize : undefined;

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
        // If customSize provided, apply width to container
        customSize ? { width: customSize } : {},
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
              borderRadius: borderRadius,
              paddingBottom: sizeStyle.shadowDepth,
              width: buttonWidth,
            }
          ]} 
        >
          {/* Main button */}
          <Animated.View
            style={[
              styles.buttonLayer,
              {
                backgroundColor: colors.main,
                borderRadius: borderRadius,
                // For circles, we don't want vertical padding from sizeStyle affecting the shape
                // We rely on flex layout to center content
                paddingVertical: shape === 'circle' ? 0 : sizeStyle.paddingVertical,
                paddingHorizontal: shape === 'circle' ? 0 : sizeStyle.paddingHorizontal,
                transform: [{ translateY }],
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8,
                width: buttonWidth || (shape === 'circle' ? '100%' : undefined), // Fallback
                height: faceHeight, // Explicit height if circle
                aspectRatio: shape === 'circle' && !customSize ? 1 : undefined, // Fallback ratio
              }
            ]}
          >
            {icon && (
              <Ionicons 
                name={icon} 
                size={iconSize || (size === 'large' ? 32 : size === 'medium' ? 24 : 20)} 
                color="white" 
              />
            )}
            {title ? (
              <Text 
                style={[
                  styles.text,
                  { fontSize: sizeStyle.fontSize }
                ]}
              >
                {title}
              </Text>
            ) : null}
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

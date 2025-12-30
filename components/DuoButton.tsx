import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
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
    main: '#B0B0B0', 
    shadow: '#808080',
  },
};

const sizes = {
  small: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    fontSize: 18,
    borderRadius: 20,
    shadowDepth: 7,
  },
  medium: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    fontSize: 22,
    borderRadius: 26,
    shadowDepth: 9,
  },
  large: {
    paddingVertical: 20,
    paddingHorizontal: 56,
    fontSize: 26,
    borderRadius: 32,
    shadowDepth: 11,
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
  
  // For circles, ensure shadow depth is proportional
  const circleShadowDepth = shape === 'circle' && customSize 
    ? Math.max(6, Math.min(customSize * 0.12, 12)) 
    : sizeStyle.shadowDepth;

  // Animation values
  const pressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowScaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animate press down with smooth, responsive feel
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 80,
        bounciness: 0,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 80,
        bounciness: 0,
      }),
      Animated.spring(shadowScaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 80,
        bounciness: 0,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;

    // Animate press up with satisfying bounce
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 25,
        bounciness: 15,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 25,
        bounciness: 15,
      }),
      Animated.spring(shadowScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 25,
        bounciness: 15,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
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

  // Interpolate press animation with smoother curve
  const shadowDepth = shape === 'circle' ? circleShadowDepth : sizeStyle.shadowDepth;
  // For circles, start slightly above center to account for shadow, then press down
  const initialOffset = shape === 'circle' ? -(shadowDepth * 0.5) : 0;
  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [initialOffset, initialOffset + shadowDepth - 1],
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
          opacity: disabled ? 0.7 : opacityAnim,
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
        {/* Shadow layer - creates the 3D depth */}
        <Animated.View 
          style={[
            styles.shadowLayer,
            shape === 'circle' && styles.circleShadowLayer,
            {
              backgroundColor: colors.shadow,
              borderRadius: borderRadius,
              width: buttonWidth,
              height: shape === 'circle' && customSize ? customSize + shadowDepth : undefined,
              paddingBottom: shape === 'circle' ? shadowDepth : sizeStyle.shadowDepth,
              borderWidth: 0,
              transform: [{ scale: shadowScaleAnim }],
            }
          ]} 
        >
          {/* Main button face */}
          <Animated.View
            style={[
              styles.buttonLayer,
              shape === 'circle' && styles.circleButtonLayer,
              {
                backgroundColor: colors.main,
                borderRadius: borderRadius,
                paddingVertical: shape === 'circle' ? 0 : sizeStyle.paddingVertical,
                paddingHorizontal: shape === 'circle' ? 0 : sizeStyle.paddingHorizontal,
                transform: [{ translateY }],
                flexDirection: shape === 'circle' && !title ? 'column' : 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: shape === 'circle' && !title ? 0 : 8,
                width: buttonWidth || (shape === 'circle' ? '100%' : undefined),
                height: faceHeight,
                aspectRatio: shape === 'circle' && !customSize ? 1 : undefined,
                minWidth: shape === 'circle' && customSize ? customSize : undefined,
                minHeight: shape === 'circle' && customSize ? customSize : undefined,
              }
            ]}
          >
            {icon && (
              <Ionicons 
                name={icon} 
                size={iconSize || (size === 'large' ? 32 : size === 'medium' ? 24 : 20)} 
                color="white" 
                style={shape === 'circle' && !title ? styles.circleIcon : undefined}
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
    overflow: 'hidden',
  },
  circleShadowLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleButtonLayer: {
    margin: 0,
    padding: 0,
  },
  circleIcon: {
    margin: 0,
    padding: 0,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'BalsamiqSans',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    zIndex: 1,
  },
});

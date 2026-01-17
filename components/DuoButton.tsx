import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useRef } from 'react';
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
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray';
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

function DuoButtonComponent({ 
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
  // Memoize colors calculation to prevent recalculation on every render
  const colors = useMemo(
    () => disabled ? colorSchemes.gray : colorSchemes[color],
    [disabled, color]
  );
  const sizeStyle = sizes[size];
  
  // Memoize expensive style calculations
  const { borderRadius, buttonWidth, faceHeight, circleShadowDepth } = useMemo(() => {
    // Calculate border radius based on shape
    const borderRadius = shape === 'circle' ? 999 : sizeStyle.borderRadius;

    // Determine dimensions if customSize is provided
    // For circles, customSize = diameter of the TOP FACE
    const buttonWidth: number | string | undefined = customSize ? customSize : (shape === 'circle' ? undefined : '100%');
    // For circles, height of the top face is customSize.
    // The container will be taller by shadowDepth.
    const faceHeight = customSize && shape === 'circle' ? customSize : undefined;
    
    // For circles, ensure shadow depth is proportional
    const circleShadowDepth = shape === 'circle' && customSize 
      ? Math.max(6, Math.min(customSize * 0.12, 12)) 
      : sizeStyle.shadowDepth;

    return { borderRadius, buttonWidth, faceHeight, circleShadowDepth };
  }, [shape, sizeStyle.borderRadius, sizeStyle.shadowDepth, customSize]);

  // Animation values
  const pressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowScaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Memoize animation configs to prevent recreation
  const pressInConfig = useMemo(() => ({
    pressAnim: {
      toValue: 1,
      useNativeDriver: true,
      speed: 100, // Increased speed for faster response
      bounciness: 0,
    },
    scaleAnim: {
      toValue: 0.96, // Less scale for smoother feel
      useNativeDriver: true,
      speed: 100,
      bounciness: 0,
    },
    shadowScaleAnim: {
      toValue: 0.99,
      useNativeDriver: true,
      speed: 100,
      bounciness: 0,
    },
    opacityAnim: {
      toValue: 0.85,
      duration: 80, // Faster duration
      useNativeDriver: true,
    },
  }), []);

  const pressOutConfig = useMemo(() => ({
    pressAnim: {
      toValue: 0,
      useNativeDriver: true,
      speed: 30, // Faster bounce back
      bounciness: 12, // Reduced bounciness for faster response
    },
    scaleAnim: {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 12,
    },
    shadowScaleAnim: {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 12,
    },
    opacityAnim: {
      toValue: 1,
      duration: 120, // Faster duration
      useNativeDriver: true,
    },
  }), []);

  // Debounce haptic feedback to prevent lag
  const hapticTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    
    // Defer haptic feedback using requestAnimationFrame to prevent blocking
    if (hapticTimeoutRef.current) {
      clearTimeout(hapticTimeoutRef.current);
    }
    
    // Use requestAnimationFrame to defer haptic feedback
    requestAnimationFrame(() => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Changed to Light for less lag
      }
    });

    // Animate press down with optimized config
    Animated.parallel([
      Animated.spring(pressAnim, pressInConfig.pressAnim),
      Animated.spring(scaleAnim, pressInConfig.scaleAnim),
      Animated.spring(shadowScaleAnim, pressInConfig.shadowScaleAnim),
      Animated.timing(opacityAnim, pressInConfig.opacityAnim),
    ]).start();
  }, [disabled, pressAnim, scaleAnim, shadowScaleAnim, opacityAnim, pressInConfig]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    // Animate press up with optimized config
    Animated.parallel([
      Animated.spring(pressAnim, pressOutConfig.pressAnim),
      Animated.spring(scaleAnim, pressOutConfig.scaleAnim),
      Animated.spring(shadowScaleAnim, pressOutConfig.shadowScaleAnim),
      Animated.timing(opacityAnim, pressOutConfig.opacityAnim),
    ]).start();
  }, [disabled, pressAnim, scaleAnim, shadowScaleAnim, opacityAnim, pressOutConfig]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    // Call onPress immediately without haptic to prevent lag
    onPress?.();
    
    // Optional: Light haptic on release (deferred)
    requestAnimationFrame(() => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    });
  }, [disabled, onPress]);

  // Interpolate press animation with smoother curve
  const shadowDepth = shape === 'circle' ? circleShadowDepth : sizeStyle.shadowDepth;
  // For circles, start slightly above center to account for shadow, then press down
  const initialOffset = shape === 'circle' ? -(shadowDepth * 0.5) : 0;
  const translateY = useMemo(
    () => pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [initialOffset, initialOffset + shadowDepth - 1],
    }),
    [pressAnim, initialOffset, shadowDepth]
  );

  // Memoize icon size calculation
  const calculatedIconSize = useMemo(
    () => iconSize || (size === 'large' ? 32 : size === 'medium' ? 24 : 20),
    [iconSize, size]
  );

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
              width: buttonWidth as any,
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
                width: (buttonWidth || (shape === 'circle' ? '100%' : undefined)) as any,
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
                size={calculatedIconSize} 
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

// Optimize memo comparison
export const DuoButton = React.memo(DuoButtonComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.color === nextProps.color &&
    prevProps.size === nextProps.size &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.icon === nextProps.icon &&
    prevProps.iconSize === nextProps.iconSize &&
    prevProps.shape === nextProps.shape &&
    prevProps.customSize === nextProps.customSize &&
    prevProps.style === nextProps.style
  );
});
DuoButton.displayName = 'DuoButton';

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

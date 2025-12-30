import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants';

interface FloatingShapesBackgroundProps {
  enabled?: boolean;
  shapeCount?: number;
}

interface ShapeConfig {
  name: string;
  size: number;
  borderRadius: number;
  backgroundColor: string;
  opacity: number;
  top: number | string;
  left?: number | string;
  right?: number | string;
  duration: number;
  transforms: {
    translateY?: { from: number; to: number };
    translateX?: { from: number; to: number };
    rotate?: { from: string; to: string };
    scale?: { from: number; mid: number; to: number };
  };
}

const defaultShapes: ShapeConfig[] = [
  {
    name: 'circle1',
    size: 80,
    borderRadius: 40,
    backgroundColor: Colors.shapePink,
    opacity: 0.3,
    top: 100,
    left: '10%',
    duration: 4000,
    transforms: {
      translateY: { from: 0, to: -30 },
      translateX: { from: 0, to: 20 },
    },
  },
  {
    name: 'square1',
    size: 60,
    borderRadius: 15,
    backgroundColor: Colors.shapeBlue,
    opacity: 0.25,
    top: 200,
    right: '15%',
    duration: 5000,
    transforms: {
      translateY: { from: 0, to: 40 },
      rotate: { from: '0deg', to: '360deg' },
    },
  },
  {
    name: 'circle2',
    size: 100,
    borderRadius: 50,
    backgroundColor: Colors.shapeYellow,
    opacity: 0.2,
    top: 450,
    left: '60%',
    duration: 6000,
    transforms: {
      translateY: { from: 0, to: -50 },
      scale: { from: 1, mid: 1.1, to: 1 },
    },
  },
  {
    name: 'square2',
    size: 70,
    borderRadius: 20,
    backgroundColor: Colors.shapeGreen,
    opacity: 0.25,
    top: 600,
    left: '8%',
    duration: 4500,
    transforms: {
      translateY: { from: 0, to: 35 },
      translateX: { from: 0, to: -25 },
    },
  },
  {
    name: 'circle3',
    size: 90,
    borderRadius: 45,
    backgroundColor: Colors.shapePurple,
    opacity: 0.2,
    top: 500,
    right: '12%',
    duration: 5500,
    transforms: {
      translateY: { from: 0, to: -45 },
      rotate: { from: '0deg', to: '-180deg' },
    },
  },
];

export const FloatingShapesBackground = React.memo<FloatingShapesBackgroundProps>(
  ({ enabled = true, shapeCount = 5 }) => {
    const shapes = useMemo(() => defaultShapes.slice(0, shapeCount), [shapeCount]);
    const animValues = useRef(
      shapes.map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
      if (!enabled) return;

      const animations = shapes.map((shape, index) => {
        const anim = animValues[index];
        const { transforms, duration } = shape;

        const createTransform = () => {
          const transformArray: any[] = [];

          if (transforms.translateY) {
            transformArray.push({
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [transforms.translateY.from, transforms.translateY.to],
              }),
            });
          }

          if (transforms.translateX) {
            transformArray.push({
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [transforms.translateX.from, transforms.translateX.to],
              }),
            });
          }

          if (transforms.rotate) {
            transformArray.push({
              rotate: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [transforms.rotate.from, transforms.rotate.to],
              }),
            });
          }

          if (transforms.scale) {
            transformArray.push({
              scale: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [transforms.scale.from, transforms.scale.mid, transforms.scale.to],
              }),
            });
          }

          return transformArray;
        };

        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration,
              useNativeDriver: true,
            }),
          ])
        );
      });

      animations.forEach((anim) => anim.start());

      return () => {
        animations.forEach((anim) => anim.stop());
      };
    }, [enabled, shapes, animValues]);

    if (!enabled) return null;

    return (
      <View style={styles.container} pointerEvents="none">
        {shapes.map((shape, index) => {
          const anim = animValues[index];
          const { transforms } = shape;

          const transformArray: any[] = [];
          if (transforms.translateY) {
            transformArray.push({
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [transforms.translateY!.from, transforms.translateY!.to],
              }),
            });
          }
          if (transforms.translateX) {
            transformArray.push({
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [transforms.translateX!.from, transforms.translateX!.to],
              }),
            });
          }
          if (transforms.rotate) {
            transformArray.push({
              rotate: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [transforms.rotate!.from, transforms.rotate!.to],
              }),
            });
          }
          if (transforms.scale) {
            transformArray.push({
              scale: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [transforms.scale!.from, transforms.scale!.mid, transforms.scale!.to],
              }),
            });
          }

          return (
            <Animated.View
              key={shape.name}
              style={[
                styles.shape,
                {
                  width: shape.size,
                  height: shape.size,
                  borderRadius: shape.borderRadius,
                  backgroundColor: shape.backgroundColor,
                  opacity: shape.opacity,
                  top: shape.top,
                  ...(shape.left !== undefined && { left: shape.left }),
                  ...(shape.right !== undefined && { right: shape.right }),
                  transform: transformArray,
                },
              ]}
            />
          );
        })}
      </View>
    );
  }
);

FloatingShapesBackground.displayName = 'FloatingShapesBackground';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  shape: {
    position: 'absolute',
  },
});


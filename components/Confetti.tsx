import React, { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  shape: "circle" | "square";
}

interface ConfettiProps {
  start: boolean;
  onComplete?: () => void;
  count?: number;
  colors?: string[];
  duration?: number;
}

export const Confetti = React.forwardRef<
  { start: () => void },
  Omit<ConfettiProps, "start">
>(({ onComplete, count = 200, colors, duration = 3000 }, ref) => {
  const [pieces, setPieces] = React.useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = React.useState(false);
  const completionCount = useRef(0);
  const expectedCount = useRef(0);

  const defaultColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#FFD93D",
    "#6BCF7F",
  ];

  const confettiColors = colors || defaultColors;

  const startConfetti = () => {
    const newPieces: ConfettiPiece[] = [];
    const centerX = SCREEN_WIDTH / 2;
    for (let i = 0; i < count; i++) {
      // Start from center top with some spread
      const spreadX = (Math.random() - 0.5) * 100;
      newPieces.push({
        id: i,
        x: centerX + spreadX,
        y: -20 - Math.random() * 50,
        rotation: Math.random() * 360,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        shape: Math.random() > 0.5 ? "circle" : "square",
      });
    }
    setPieces(newPieces);
    setIsActive(true);
    completionCount.current = 0;
    expectedCount.current = count;
  };

  React.useImperativeHandle(ref, () => ({
    start: startConfetti,
  }));

  const handlePieceComplete = () => {
    completionCount.current += 1;
    if (completionCount.current >= expectedCount.current) {
      setIsActive(false);
      setPieces([]);
      onComplete?.();
    }
  };

  if (!isActive || pieces.length === 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          piece={piece}
          duration={duration}
          onComplete={handlePieceComplete}
        />
      ))}
    </View>
  );
});

interface ConfettiPieceProps {
  piece: ConfettiPiece;
  duration: number;
  onComplete: () => void;
}

const ConfettiPiece = ({ piece, duration, onComplete }: ConfettiPieceProps) => {
  const translateY = useSharedValue(piece.y);
  const translateX = useSharedValue(piece.x);
  const rotation = useSharedValue(piece.rotation);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const endY = SCREEN_HEIGHT + 100;
    const horizontalDrift = (Math.random() - 0.5) * 200;
    const rotationAmount = 360 * (2 + Math.random() * 3);

    translateY.value = withSpring(
      endY,
      {
        damping: 15,
        stiffness: 100,
        mass: 0.5 + Math.random() * 0.5,
      },
      (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      }
    );

    translateX.value = withTiming(
      piece.x + horizontalDrift,
      { duration: duration * (0.8 + Math.random() * 0.4) }
    );

    rotation.value = withTiming(
      piece.rotation + rotationAmount,
      { duration: duration * (0.8 + Math.random() * 0.4) }
    );

    // Fade out in the last 30% of animation
    opacity.value = withDelay(
      duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );

    // Slight scale animation
    scale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withTiming(1, { duration: 200 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const size = 8 + Math.random() * 6;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          backgroundColor: piece.color,
          borderRadius: piece.shape === "circle" ? size / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
};

Confetti.displayName = "Confetti";


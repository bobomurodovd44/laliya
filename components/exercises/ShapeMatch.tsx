import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Exercise, Item } from "../../data/data";
import { items } from "../../lib/items-store";
import { Body, Title } from "../Typography";
import ImageWithLoader from "../common/ImageWithLoader";

interface ShapeMatchProps {
  exercise: Exercise;
  onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive card sizing based on screen and item count
const getCardSize = (itemCount: number) => {
  const columns = itemCount <= 2 ? 2 : Math.min(itemCount, 3);
  // Account for container padding (16px each side = 32px total)
  const containerPadding = 32;
  // Account for gap between cards
  const gap = 12;
  // Calculate available width after padding and gaps
  const totalGaps = gap * (columns - 1);
  const availableWidth = SCREEN_WIDTH - containerPadding - totalGaps;
  // Calculate card size based on available width
  const calculatedSize = Math.floor(availableWidth / columns);
  // Reserve space for header, divider, and sections
  const reservedHeight = 180;
  const maxHeight = Math.floor((SCREEN_HEIGHT - reservedHeight) / 2);
  // Set smaller min and max sizes to ensure they fit
  const minSize = 100;
  const maxSize = Math.min(maxHeight, 150);
  // Return size that fits both width and height constraints, ensuring it's an integer
  const finalSize = Math.max(minSize, Math.min(calculatedSize, maxSize));
  return Math.floor(finalSize);
};

const CARD_GAP = 12;

// Colors array for shape backgrounds
const SHAPE_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B88B", // Peach
  "#AED6F1", // Light Blue
];

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Get random color from array
const getRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * SHAPE_COLORS.length);
  return SHAPE_COLORS[randomIndex];
};

export default function ShapeMatch({ exercise, onComplete }: ShapeMatchProps) {
  // Get items for this exercise
  const exerciseItems = useMemo(() => {
    return exercise.optionIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined);
  }, [exercise.optionIds]);

  const CARD_SIZE = useMemo(
    () => getCardSize(exerciseItems.length),
    [exerciseItems.length]
  );
  const DROP_THRESHOLD = CARD_SIZE * 0.6;

  // Initialize with empty array - shuffle will happen in useEffect
  const [shuffledOriginals, setShuffledOriginals] = useState<Item[]>([]);

  // Random color for the shape
  const [shapeColor, setShapeColor] = useState<string>(getRandomColor());

  // Track if the correct answer has been matched
  const [isCompleted, setIsCompleted] = useState(false);

  // Track target position for drop detection (single target)
  const targetPositionRef = useRef<{ x: number; y: number } | null>(null);
  // Key to force re-measurement of target card after reset
  const [remountKey, setRemountKey] = useState(0);

  // Create stable exercise identifier
  const exerciseId = `${exercise.stageId}-${exercise.order}`;

  // Get the answer ID from exercise - use ref to ensure it's always current in callbacks
  const answerIdRef = useRef<number | undefined>(exercise.answerId);

  // Update ref when exercise changes
  useEffect(() => {
    answerIdRef.current = exercise.answerId;
  }, [exercise.answerId]);

  // Get the answer ID for rendering (not for callbacks)
  const answerId = exercise.answerId;

  // Get the answer item (the single target shape)
  const answerItem = useMemo(() => {
    if (!answerId) return null;
    return items.find((item) => item.id === answerId);
  }, [answerId]);

  // Helper function to ensure shuffle produces different order
  const ensureShuffled = useCallback((items: Item[]): Item[] => {
    return shuffleArray(items);
  }, []);

  // Reset state when exercise changes - using stable identifier
  useEffect(() => {
    // Reset all state
    setIsCompleted(false);
    isCompletedRef.current = false;
    targetPositionRef.current = null;

    // Get new random color for the shape
    setShapeColor(getRandomColor());

    // Shuffle items
    const shuffledOrig = ensureShuffled(exerciseItems);

    setShuffledOriginals(shuffledOrig);
    setRemountKey((prev) => prev + 1); // Force re-measurement
  }, [exerciseId, exerciseItems, ensureShuffled]);

  // Guard to prevent multiple onComplete calls
  const isCompletedRef = useRef(false);

  // Handle correct match - complete the exercise
  const handleCorrectMatch = useCallback(() => {
    if (isCompleted || isCompletedRef.current) return; // Prevent multiple completions

    // Mark as completed immediately
    isCompletedRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCompleted(true);
    
    // Call onComplete directly
    onComplete();
  }, [isCompleted, onComplete]);

  const handleWrongMatch = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const registerTargetPosition = useCallback((x: number, y: number) => {
    targetPositionRef.current = { x, y };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title size="medium" style={styles.title}>
          Shape Match
        </Title>
        <Body size="medium" style={styles.question}>
          {exercise.question}
        </Body>
      </View>

      {/* Original Images (Top) - Draggable */}
      <View style={styles.section}>
        <View style={styles.grid}>
          {shuffledOriginals.map((item) => (
            <DraggableCard
              key={`original-${item.id}-${remountKey}`}
              item={item}
              cardSize={CARD_SIZE}
              dropThreshold={DROP_THRESHOLD}
              targetPositionRef={targetPositionRef}
              answerIdRef={answerIdRef}
              onCorrectMatch={handleCorrectMatch}
              onWrongMatch={handleWrongMatch}
              isCompleted={isCompleted}
            />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Target Shape (Bottom) - Single shape for the answer */}
      <View style={styles.section}>
        <View style={styles.singleTargetContainer}>
          {answerItem && (
            <TargetCard
              key={`target-${answerItem.id}-${remountKey}`}
              item={answerItem}
              cardSize={CARD_SIZE}
              onLayout={registerTargetPosition}
              isCompleted={isCompleted}
              shapeColor={shapeColor}
            />
          )}
        </View>
      </View>
    </View>
  );
}

// Draggable Original Card
interface DraggableCardProps {
  item: Item;
  cardSize: number;
  dropThreshold: number;
  targetPositionRef: React.MutableRefObject<{ x: number; y: number } | null>;
  answerIdRef: React.MutableRefObject<number | undefined>;
  onCorrectMatch: () => void;
  onWrongMatch: () => void;
  isCompleted: boolean;
}

function DraggableCard({
  item,
  cardSize,
  dropThreshold,
  targetPositionRef,
  answerIdRef,
  onCorrectMatch,
  onWrongMatch,
  isCompleted,
}: DraggableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);
  const shake = useSharedValue(0);
  const opacity = useSharedValue(1);

  const startPositionRef = useRef({ x: 0, y: 0 });
  const isCompletedRef = useRef(false);
  const viewRef = useRef<any>(null);

  // Sync isCompleted ref immediately
  useEffect(() => {
    isCompletedRef.current = isCompleted;
    if (isCompleted) {
      opacity.value = withTiming(0.5, { duration: 300 });
    } else {
      opacity.value = 1;
    }
  }, [isCompleted]);

  // Reset animations when item changes (component remounts with new data)
  useEffect(() => {
    // Reset all animation values
    opacity.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    zIndex.value = 1;
    shake.value = 0;
    startPositionRef.current = { x: 0, y: 0 };
    isCompletedRef.current = false;
    // Re-measure after reset
    setTimeout(() => {
      viewRef.current?.measureInWindow((x, y) => {
        startPositionRef.current = { x, y };
      });
    }, 100);
  }, [item.id]);

  const measureCard = () => {
    viewRef.current?.measureInWindow((x, y) => {
      startPositionRef.current = { x, y };
    });
  };

  const checkDropAndHandle = useCallback(
    (finalX: number, finalY: number) => {
      // Prevent matching if already completed
      if (isCompletedRef.current) {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        return;
      }

      const targetPosition = targetPositionRef.current;

      // No target position registered yet
      if (!targetPosition) {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        return;
      }

      // Re-measure the current position to ensure accuracy
      // Use the start position plus the translation
      const currentX = startPositionRef.current.x + finalX + cardSize / 2;
      const currentY = startPositionRef.current.y + finalY + cardSize / 2;

      // Calculate distance to the single target
      const targetCenterX = targetPosition.x + cardSize / 2;
      const targetCenterY = targetPosition.y + cardSize / 2;
      const dist = Math.sqrt(
        Math.pow(currentX - targetCenterX, 2) +
          Math.pow(currentY - targetCenterY, 2)
      );

      // Check if dropped on target - use a more forgiving threshold
      // Increase threshold slightly to account for measurement inaccuracies
      const adjustedThreshold = dropThreshold * 1.2;
      if (dist < adjustedThreshold) {
        // Check if this dragged image is the correct answer
        // Compare the dragged image's id with the answerId from ref (always current)
        const draggedImageId = item.id;
        const correctAnswerId = answerIdRef.current;

        // Check if answerId exists and if dragged image id matches answer id
        // Use strict comparison - ref ensures we always have the current value
        if (
          correctAnswerId !== undefined &&
          correctAnswerId !== null &&
          draggedImageId === correctAnswerId
        ) {
          // Correct match! Snap to target and complete exercise
          const targetX = targetPosition.x - startPositionRef.current.x;
          const targetY = targetPosition.y - startPositionRef.current.y;
          translateX.value = withTiming(targetX, { duration: 200 });
          translateY.value = withTiming(targetY, { duration: 200 });
          scale.value = withTiming(1, { duration: 200 });
          onCorrectMatch();
          return;
        } else {
          // Wrong match - shake and return to original position
          onWrongMatch();
          shake.value = withSequence(
            withTiming(-4, { duration: 100 }),
            withTiming(4, { duration: 100 }),
            withTiming(-4, { duration: 100 }),
            withTiming(4, { duration: 100 }),
            withTiming(0, { duration: 100 })
          );
          translateX.value = withSpring(0, { damping: 15 });
          translateY.value = withSpring(0, { damping: 15 });
          return;
        }
      }

      // Not dropped on target - return to original position
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
    },
    [item.id, cardSize, dropThreshold, onCorrectMatch, onWrongMatch]
  );

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        // Early return if already matched (checked in JS thread via ref)
        scale.value = withSpring(1.05, { damping: 15 });
        zIndex.value = 100;
      })
      .onUpdate((e) => {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      })
      .onEnd((e) => {
        scale.value = withSpring(1, { damping: 15 });
        zIndex.value = 1;
        runOnJS(checkDropAndHandle)(e.translationX, e.translationY);
      });
  }, [checkDropAndHandle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + shake.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const wrapperAnimatedStyle = useAnimatedStyle(() => ({
    zIndex: zIndex.value,
  }));

  const cardDynamicStyle = {
    width: cardSize,
    height: cardSize,
    minWidth: cardSize,
    minHeight: cardSize,
    maxWidth: cardSize,
    maxHeight: cardSize,
  };

  return (
    <Animated.View ref={viewRef} onLayout={measureCard} collapsable={false} style={[cardDynamicStyle, wrapperAnimatedStyle]} pointerEvents="box-none">
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.card,
            styles.originalCard,
            cardDynamicStyle,
            animatedStyle,
          ]}
        >
        {item.imageUrl ? (
          <ImageWithLoader
            source={{ uri: item.imageUrl }}
            style={[styles.cardImage, { width: cardSize, height: cardSize }]}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[styles.cardImage, { backgroundColor: "transparent" }]}
          />
        )}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// Target Drop Zone (Blurred)
interface TargetCardProps {
  item: Item;
  cardSize: number;
  onLayout: (x: number, y: number) => void;
  isCompleted: boolean;
  shapeColor: string;
}

function TargetCard({
  item,
  cardSize,
  onLayout,
  isCompleted,
  shapeColor,
}: TargetCardProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isCompleted) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [isCompleted]);

  const viewRef = useRef<any>(null);

  const handleLayout = () => {
    viewRef.current?.measureInWindow((x, y) => {
      onLayout(x, y);
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardDynamicStyle = {
    width: cardSize,
    height: cardSize,
    minWidth: cardSize,
    minHeight: cardSize,
    maxWidth: cardSize,
    maxHeight: cardSize,
  };

  return (
    <View ref={viewRef} onLayout={handleLayout} collapsable={false} style={cardDynamicStyle}>
      <Animated.View
        style={[
          styles.card,
          styles.targetCard,
          cardDynamicStyle,
          isCompleted && styles.targetCardMatched,
          animatedStyle,
        ]}
      >
      {item.imageUrl ? (
        <View style={styles.blurContainer}>
          <ImageWithLoader
            source={{ uri: item.imageUrl }}
            style={[
              styles.cardImage,
              {
                width: cardSize,
                height: cardSize,
              },
            ]}
            resizeMode="contain"
            tintColor={isCompleted ? undefined : shapeColor}
          />
        </View>
      ) : (
        <View
          style={[styles.blurContainer, { backgroundColor: "transparent" }]}
        />
      )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  title: {
    color: "#FF1493",
    textAlign: "center",
    marginBottom: 6,
  },
  question: {
    color: "#666",
    textAlign: "center",
    marginBottom: 0,
  },
  section: {
    marginBottom: 12,
    flexShrink: 1,
  },
  divider: {
    height: 2,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
    marginHorizontal: 0,
    borderRadius: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    alignContent: "flex-start",
    gap: CARD_GAP,
    paddingVertical: 4,
    width: "100%",
  },
  singleTargetContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
    width: "100%",
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    flexShrink: 0,
    flexGrow: 0,
    flexBasis: "auto",
  },
  originalCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  targetCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  targetCardMatched: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  blurContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  grayscaleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  cardLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 140, 0, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  cardLabelText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
  matchedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  matchedBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#58CC02",
    alignItems: "center",
    justifyContent: "center",
  },
  matchedBadgeText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
});

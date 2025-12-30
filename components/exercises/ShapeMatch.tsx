import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Exercise, Item, items } from '../../data/data';

interface ShapeMatchProps {
  exercise: Exercise;
  onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive card sizing based on screen and item count
const getCardSize = (itemCount: number) => {
  const columns = itemCount <= 2 ? 2 : Math.min(itemCount, 3);
  const horizontalPadding = 40;
  const gap = 12;
  const availableWidth = SCREEN_WIDTH - horizontalPadding - (gap * (columns - 1));
  const maxHeight = (SCREEN_HEIGHT - 350) / 2;
  return Math.min(availableWidth / columns, maxHeight, 160);
};

const CARD_GAP = 12;

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function ShapeMatch({ exercise, onComplete }: ShapeMatchProps) {
  // Get items for this exercise
  const exerciseItems = useMemo(() => {
    return exercise.optionIds
      .map(id => items.find(item => item.id === id))
      .filter((item): item is Item => item !== undefined);
  }, [exercise.optionIds]);

  const CARD_SIZE = useMemo(() => getCardSize(exerciseItems.length), [exerciseItems.length]);
  const DROP_THRESHOLD = CARD_SIZE * 0.6;

  // Shuffle orders independently
  const [shuffledOriginals, setShuffledOriginals] = useState(() => shuffleArray(exerciseItems));
  const [shuffledTargets, setShuffledTargets] = useState(() => shuffleArray(exerciseItems));

  // Track matched items
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  
  // Track target positions for drop detection
  const targetPositionsRef = useRef<Record<number, { x: number; y: number }>>({});

  // Reset state when exercise changes OR when component remounts
  // Using optionIds.join() to create a stable dependency
  useEffect(() => {
    console.log('ShapeMatch - Resetting state for exercise:', exercise.order, exercise.stageId);
    setMatchedIds(new Set());
    setShuffledOriginals(shuffleArray(exerciseItems));
    setShuffledTargets(shuffleArray(exerciseItems));
    targetPositionsRef.current = {};
  }, [exercise.order, exercise.stageId, exercise.optionIds.join(',')]);

  // Check if all matches are correct
  const allMatched = matchedIds.size === exerciseItems.length;

  useEffect(() => {
    if (allMatched) {
      onComplete();
    }
  }, [allMatched]);

  const handleSuccessMatch = useCallback((itemId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMatchedIds(prev => new Set([...prev, itemId]));
  }, []);

  const handleWrongMatch = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const registerTargetPosition = useCallback((itemId: number, x: number, y: number) => {
    targetPositionsRef.current[itemId] = { x, y };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('ShapeMatch - Exercise Items:', exerciseItems);
    console.log('ShapeMatch - Shuffled Originals:', shuffledOriginals);
    console.log('ShapeMatch - Shuffled Targets:', shuffledTargets);
    console.log('ShapeMatch - Matched IDs:', Array.from(matchedIds));
  }, [exerciseItems, shuffledOriginals, shuffledTargets, matchedIds]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shape Match</Text>
      <Text style={styles.question}>{exercise.question}</Text>

      {/* Original Images (Top) - Draggable */}
      <View style={styles.section}>
        <View style={styles.grid}>
          {shuffledOriginals.map((item) => (
            <DraggableCard
              key={`original-${item.id}`}
              item={item}
              cardSize={CARD_SIZE}
              dropThreshold={DROP_THRESHOLD}
              targetPositionsRef={targetPositionsRef}
              onSuccessMatch={handleSuccessMatch}
              onWrongMatch={handleWrongMatch}
              isMatched={matchedIds.has(item.id)}
            />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Target Shapes (Bottom) - Blurred & Grayscale */}
      <View style={styles.section}>
        <View style={styles.grid}>
          {shuffledTargets.map((item) => (
            <TargetCard
              key={`target-${item.id}`}
              item={item}
              cardSize={CARD_SIZE}
              onLayout={registerTargetPosition}
              isMatched={matchedIds.has(item.id)}
            />
          ))}
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
  targetPositionsRef: React.MutableRefObject<Record<number, { x: number; y: number }>>;
  onSuccessMatch: (itemId: number) => void;
  onWrongMatch: () => void;
  isMatched: boolean;
}

function DraggableCard({ item, cardSize, dropThreshold, targetPositionsRef, onSuccessMatch, onWrongMatch, isMatched }: DraggableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);
  const shake = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const startPositionRef = useRef({ x: 0, y: 0 });
  const isMatchedRef = useRef(false);

  // Reset animations when item changes (component remounts with new data)
  useEffect(() => {
    opacity.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    zIndex.value = 1;
    shake.value = 0;
  }, [item.id]);

  useEffect(() => {
    isMatchedRef.current = isMatched;
    if (isMatched) {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isMatched]);

  const measureCard = (event: any) => {
    event.target.measureInWindow((x: number, y: number) => {
      startPositionRef.current = { x, y };
    });
  };

  const checkDropAndHandle = useCallback((finalX: number, finalY: number) => {
    const targetPositions = targetPositionsRef.current;
    const currentX = startPositionRef.current.x + finalX + cardSize / 2;
    const currentY = startPositionRef.current.y + finalY + cardSize / 2;

    // Find closest target
    interface ClosestTarget {
      id: number;
      dist: number;
      pos: { x: number; y: number };
    }
    
    let closestTarget: ClosestTarget | null = null;
    
    Object.entries(targetPositions).forEach(([id, pos]) => {
      const targetCenterX = pos.x + cardSize / 2;
      const targetCenterY = pos.y + cardSize / 2;
      const dist = Math.sqrt(
        Math.pow(currentX - targetCenterX, 2) + 
        Math.pow(currentY - targetCenterY, 2)
      );
      
      if (dist < dropThreshold && (!closestTarget || dist < closestTarget.dist)) {
        closestTarget = { id: parseInt(id), dist, pos } as ClosestTarget;
      }
    });

    // No target hit - return to original position
    if (closestTarget === null) {
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      return;
    }

    // At this point, closestTarget is definitely not null
    const matchedTarget: ClosestTarget = closestTarget;

    // Correct match! Snap to target
    if (matchedTarget.id === item.id) {
      translateX.value = withSpring(matchedTarget.pos.x - startPositionRef.current.x);
      translateY.value = withSpring(matchedTarget.pos.y - startPositionRef.current.y);
      onSuccessMatch(item.id);
      return;
    }

    // Wrong match - shake and return
    onWrongMatch();
    shake.value = withSequence(
      withTiming(-4, { duration: 100 }),
      withTiming(4, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
    translateX.value = withSpring(0, { damping: 15 });
    translateY.value = withSpring(0, { damping: 15 });
  }, [item.id, cardSize, dropThreshold, onSuccessMatch, onWrongMatch]);

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(!isMatchedRef.current)
      .onStart(() => {
        scale.value = withSpring(1.08);
        zIndex.value = 100;
      })
      .onUpdate((e) => {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      })
      .onEnd((e) => {
        scale.value = withSpring(1);
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
    zIndex: zIndex.value,
    opacity: opacity.value,
  }));

  const cardDynamicStyle = {
    width: cardSize,
    height: cardSize,
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View 
        style={[styles.card, styles.originalCard, cardDynamicStyle, animatedStyle]}
        onLayout={measureCard}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.cardImage, { width: cardSize, height: cardSize }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: '#E0E0E0' }]} />
        )}
        <View style={styles.cardLabel}>
          <Text style={styles.cardLabelText}>{item.word}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// Target Drop Zone (Blurred)
interface TargetCardProps {
  item: Item;
  cardSize: number;
  onLayout: (itemId: number, x: number, y: number) => void;
  isMatched: boolean;
}

function TargetCard({ item, cardSize, onLayout, isMatched }: TargetCardProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isMatched) {
      scale.value = withSequence(
        withSpring(1.12, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [isMatched]);

  const handleLayout = (event: any) => {
    event.target.measureInWindow((x: number, y: number) => {
      onLayout(item.id, x, y);
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardDynamicStyle = {
    width: cardSize,
    height: cardSize,
  };

  return (
    <Animated.View 
      style={[
        styles.card, 
        styles.targetCard,
        cardDynamicStyle,
        isMatched && styles.targetCardMatched,
        animatedStyle
      ]}
      onLayout={handleLayout}
    >
      {item.imageUrl ? (
        <View style={styles.blurContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.cardImage, { width: cardSize, height: cardSize }]}
            resizeMode="cover"
            blurRadius={isMatched ? 0 : 10}
          />
          {!isMatched && <View style={styles.grayscaleOverlay} />}
        </View>
      ) : (
        <View style={[styles.blurContainer, { backgroundColor: '#E0E0E0' }]} />
      )}
      {isMatched && (
        <View style={styles.matchedOverlay}>
          <View style={styles.matchedBadge}>
            <Text style={styles.matchedBadgeText}>✓</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 26,
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 4,
  },
  question: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
    marginHorizontal: 40,
    borderRadius: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: CARD_GAP,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  originalCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FF8C00',
  },
  targetCard: {
    backgroundColor: '#F0F0F0',
    borderWidth: 3,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
  },
  targetCardMatched: {
    borderColor: '#58CC02',
    borderStyle: 'solid',
    borderWidth: 3,
    backgroundColor: '#E8FFE8',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  grayscaleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
  },
  cardLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 140, 0, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  cardLabelText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  matchedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#58CC02',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  matchedBadgeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

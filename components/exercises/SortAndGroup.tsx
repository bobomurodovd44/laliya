import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { categories, Exercise, Item } from '../../data/data';
import { items } from '../../lib/items-store';
import { Colors, Spacing, Typography } from '../../constants';
import { Body, Title } from '../Typography';
import ImageWithLoader from '../common/ImageWithLoader';

interface SortAndGroupProps {
  exercise: Exercise;
  onComplete: (isCorrect?: boolean) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate card size for center grid (2x2)
const getCardSize = () => {
  const containerPadding = 32;
  const gap = 16;
  const availableWidth = SCREEN_WIDTH - containerPadding;
  const calculatedSize = Math.floor((availableWidth - gap) / 2);
  const minSize = 90;
  const maxSize = 120;
  return Math.max(minSize, Math.min(calculatedSize, maxSize));
};

// Calculate smaller card size for category drop zones
const getCategoryCardSize = (centerCardSize: number) => {
  return Math.floor(centerCardSize * 0.65); // 65% of center card size
};

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function SortAndGroup({ exercise, onComplete }: SortAndGroupProps) {
  const CARD_SIZE = useMemo(() => getCardSize(), []);
  const CATEGORY_CARD_SIZE = useMemo(() => getCategoryCardSize(CARD_SIZE), [CARD_SIZE]);
  const DROP_THRESHOLD = CARD_SIZE * 0.7;

  // Get items for this exercise
  const exerciseItems = useMemo(() => {
    const foundItems = exercise.optionIds
      .map(id => items.find(item => item.id === id))
      .filter((item): item is Item => item !== undefined);
    
    // Log all item details for debugging
    console.log('SortAndGroup: All exercise items details:', {
      optionIds: exercise.optionIds,
      foundItems: foundItems.map(item => ({
        id: item.id,
        word: item.word,
        categoryId: item.categoryId,
        imageUrl: item.imageUrl
      })),
      totalItemsInStore: items.length,
      allItemsInStore: items.map(item => ({
        id: item.id,
        word: item.word,
        categoryId: item.categoryId
      }))
    });
    
    // Log if some items weren't found
    if (foundItems.length !== exercise.optionIds.length) {
      const missingIds = exercise.optionIds.filter(id => !items.find(item => item.id === id));
      console.warn('SortAndGroup: Some items not found in store:', {
        expected: exercise.optionIds.length,
        found: foundItems.length,
        missingIds
      });
    }
    
    return foundItems;
  }, [exercise.optionIds]);

  // Group items by category
  const categoryGroups = useMemo(() => {
    const groups = new Map<number, Item[]>();
    exerciseItems.forEach(item => {
      const categoryId = item.categoryId;
      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(item);
    });
    
    const grouped = Array.from(groups.entries());
    
    // Log category grouping details
    console.log('SortAndGroup: Category grouping:', {
      totalItems: exerciseItems.length,
      categoryCount: grouped.length,
      categories: grouped.map(([categoryId, items]) => ({
        categoryId,
        itemCount: items.length,
        items: items.map(item => ({
          id: item.id,
          word: item.word,
          categoryId: item.categoryId
        }))
      }))
    });
    
    return grouped;
  }, [exerciseItems]);

  // Should have exactly 2 categories with 2-4 total options (at least 1 per category)
  const [category1, category2, isValid, validationError] = useMemo(() => {
    const totalOptions = exerciseItems.length;
    const numCategories = categoryGroups.length;
    
    // Debug logging
    console.log('SortAndGroup Validation:', {
      totalOptions,
      numCategories,
      categoryGroups: categoryGroups.map(([id, items]) => ({ categoryId: id, itemCount: items.length })),
      exerciseOptionIds: exercise.optionIds,
      exerciseItemsCount: exerciseItems.length
    });
    
    // Validate: exactly 2 categories
    if (numCategories !== 2) {
      console.log('Validation failed: Expected 2 categories, found', numCategories);
      const categoryDetails = categoryGroups.map(([id, items]) => 
        `Category ${id}: ${items.length} item(s)`
      ).join(', ');
      return [null, null, false, `Expected 2 categories, found ${numCategories}. ${categoryDetails}. All items must belong to exactly 2 different categories.`];
    }
    
    // Validate: total options must be 2-4
    if (totalOptions < 2 || totalOptions > 4) {
      console.log('Validation failed: Expected 2-4 options, found', totalOptions);
      return [null, null, false, `Expected 2-4 options, found ${totalOptions}`];
    }
    
    const [cat1Id, cat1Items] = categoryGroups[0];
    const [cat2Id, cat2Items] = categoryGroups[1];
    
    // Validate: each category must have at least 1 item
    if (cat1Items.length === 0 || cat2Items.length === 0) {
      console.log('Validation failed: Category 1 has', cat1Items.length, 'items, Category 2 has', cat2Items.length, 'items');
      return [null, null, false, `Category 1 has ${cat1Items.length} items, Category 2 has ${cat2Items.length} items`];
    }
    
    const cat1 = categories.find(c => c.id === cat1Id);
    const cat2 = categories.find(c => c.id === cat2Id);
    console.log('Validation passed:', {
      category1: { id: cat1Id, title: cat1?.title, itemCount: cat1Items.length },
      category2: { id: cat2Id, title: cat2?.title, itemCount: cat2Items.length }
    });
    return [
      { id: cat1Id, title: cat1?.title || '', items: cat1Items },
      { id: cat2Id, title: cat2?.title || '', items: cat2Items },
      true,
      null,
    ];
  }, [categoryGroups, exerciseItems, exercise.optionIds]);

  // Shuffled items for center grid
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
  
  // Track which items are in which category (itemId -> categoryId or null if in center)
  const [itemPlacements, setItemPlacements] = useState<Map<number, number | null>>(new Map());
  
  // Track if completed
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Guard to prevent multiple onComplete calls
  const isCompletedRef = useRef(false);
  const wrongDropCountRef = useRef(0);

  // Position refs for category drop zones
  const topCategoryPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const bottomCategoryPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Create stable exercise identifier
  const exerciseId = `${exercise.stageId}-${exercise.order}`;

  // Initialize items in center
  useEffect(() => {
    if (!category1 || !category2) return;
    
    const shuffled = shuffleArray(exerciseItems);
    setShuffledItems(shuffled);
    
    // Initialize all items as being in center (null)
    const placements = new Map<number, number | null>();
    exerciseItems.forEach(item => {
      placements.set(item.id, null);
    });
    setItemPlacements(placements);
    setIsCompleted(false);
    isCompletedRef.current = false;
    wrongDropCountRef.current = 0;
  }, [exerciseId, exerciseItems, category1, category2]);

  // Check if all items are correctly placed
  const checkCompletion = useCallback(() => {
    if (!category1 || !category2) return false;
    
    let allCorrect = true;
    exerciseItems.forEach(item => {
      const placement = itemPlacements.get(item.id);
      const correctCategory = item.categoryId;
      if (placement !== correctCategory) {
        allCorrect = false;
      }
    });
    
    return allCorrect;
  }, [exerciseItems, itemPlacements, category1, category2]);

  // Update completion status
  useEffect(() => {
    if (checkCompletion() && !isCompleted && !isCompletedRef.current) {
      // Mark as completed immediately
      isCompletedRef.current = true;
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Call onComplete with isCorrect = true (default)
      onComplete(true);
    }
  }, [itemPlacements, checkCompletion, isCompleted, onComplete]);

  const handleCorrectDrop = useCallback((itemId: number, categoryId: number) => {
    setItemPlacements(prev => {
      const newPlacements = new Map(prev);
      newPlacements.set(itemId, categoryId);
      return newPlacements;
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleWrongDrop = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    // Increment wrong drop counter
    wrongDropCountRef.current += 1;
    
    // Call onComplete(false) after 4 wrong drops to show KeepGoing celebration
    if (wrongDropCountRef.current >= 4 && !isCompletedRef.current) {
      isCompletedRef.current = true;
      onComplete(false);
    }
  }, [onComplete]);

  const registerTopCategoryPosition = useCallback((x: number, y: number, width: number, height: number) => {
    topCategoryPositionRef.current = { x, y, width, height };
  }, []);

  const registerBottomCategoryPosition = useCallback((x: number, y: number, width: number, height: number) => {
    bottomCategoryPositionRef.current = { x, y, width, height };
  }, []);

  // Show error if validation failed (isValid is false) or if categories aren't set
  if (isValid === false || !category1 || !category2) {
    console.log('Rendering error screen:', { category1: !!category1, category2: !!category2, isValid, validationError });
    return (
      <View style={styles.container}>
        <Body style={styles.errorText}>
          Invalid exercise: Need exactly 2 categories with 2-4 total options (at least 1 per category)
          {validationError && `\n${validationError}`}
        </Body>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Body size="large" style={styles.question}>{exercise.question}</Body>

      {/* Top Category Section */}
      <View style={styles.categorySection}>
        <CategoryDropZone
          category={category1}
          cardSize={CATEGORY_CARD_SIZE}
          onLayout={registerTopCategoryPosition}
          isCompleted={isCompleted}
          itemsInCategory={exerciseItems.filter(item => itemPlacements.get(item.id) === category1.id)}
        />
      </View>

      {/* Center Grid - Draggable Items */}
      <View style={styles.centerSection}>
        <View style={[styles.grid, { width: CARD_SIZE * 2 + 16 }]}>
          {shuffledItems.map((item) => {
            const placement = itemPlacements.get(item.id);
            // Only show in center if not placed in a category
            if (placement !== null) return null;
            
            return (
              <DraggableCard
                key={`item-${item.id}`}
                item={item}
                cardSize={CARD_SIZE}
                dropThreshold={DROP_THRESHOLD}
                topCategoryPositionRef={topCategoryPositionRef}
                bottomCategoryPositionRef={bottomCategoryPositionRef}
                topCategoryId={category1.id}
                bottomCategoryId={category2.id}
                onCorrectDrop={handleCorrectDrop}
                onWrongDrop={handleWrongDrop}
                isCompleted={isCompleted}
              />
            );
          })}
        </View>
      </View>

      {/* Bottom Category Section */}
      <View style={styles.categorySection}>
        <CategoryDropZone
          category={category2}
          cardSize={CATEGORY_CARD_SIZE}
          onLayout={registerBottomCategoryPosition}
          isCompleted={isCompleted}
          itemsInCategory={exerciseItems.filter(item => itemPlacements.get(item.id) === category2.id)}
        />
      </View>
    </View>
  );
}

// Category Drop Zone Component
interface CategoryDropZoneProps {
  category: { id: number; title: string; items: Item[] };
  cardSize: number;
  onLayout: (x: number, y: number, width: number, height: number) => void;
  isCompleted: boolean;
  itemsInCategory: Item[];
}

function CategoryDropZone({ category, cardSize, onLayout, isCompleted, itemsInCategory }: CategoryDropZoneProps) {
  const scale = useSharedValue(1);
  const expectedItemsCount = category.items.length;

  useEffect(() => {
    if (isCompleted && itemsInCategory.length === expectedItemsCount) {
      scale.value = withSequence(
        withSpring(1.05, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [isCompleted, itemsInCategory.length, expectedItemsCount]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLayout = (event: any) => {
    event.target.measureInWindow((x: number, y: number, width: number, height: number) => {
      onLayout(x, y, width, height);
    });
  };

  return (
    <Animated.View 
      style={[styles.dropZone, animatedStyle]}
      onLayout={handleLayout}
    >
      <Title size="medium" style={styles.categoryTitle}>{category.title}</Title>
      <View style={styles.dropZoneItems}>
        {itemsInCategory.map((item) => (
          <View key={item.id} style={[styles.placedCard, { width: cardSize, height: cardSize }]}>
            {item.imageUrl && (
              <ImageWithLoader
                source={{ uri: item.imageUrl }}
                style={styles.placedImage}
                resizeMode="cover"
              />
            )}
          </View>
        ))}
        {/* Show placeholders for missing items */}
        {Array.from({ length: expectedItemsCount - itemsInCategory.length }).map((_, index) => (
          <View key={`placeholder-${index}`} style={[styles.placeholderCard, { width: cardSize, height: cardSize }]} />
        ))}
      </View>
    </Animated.View>
  );
}

// Draggable Card Component
interface DraggableCardProps {
  item: Item;
  cardSize: number;
  dropThreshold: number;
  topCategoryPositionRef: React.MutableRefObject<{ x: number; y: number; width: number; height: number } | null>;
  bottomCategoryPositionRef: React.MutableRefObject<{ x: number; y: number; width: number; height: number } | null>;
  topCategoryId: number;
  bottomCategoryId: number;
  onCorrectDrop: (itemId: number, categoryId: number) => void;
  onWrongDrop: () => void;
  isCompleted: boolean;
}

function DraggableCard({
  item,
  cardSize,
  dropThreshold,
  topCategoryPositionRef,
  bottomCategoryPositionRef,
  topCategoryId,
  bottomCategoryId,
  onCorrectDrop,
  onWrongDrop,
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

  useEffect(() => {
    isCompletedRef.current = isCompleted;
    if (isCompleted) {
      opacity.value = withTiming(0.3, { duration: 300 });
    } else {
      opacity.value = 1;
    }
  }, [isCompleted]);

  const measureCard = (event: any) => {
    event.target.measureInWindow((x: number, y: number) => {
      startPositionRef.current = { x, y };
    });
  };

  const checkDropAndHandle = useCallback((finalX: number, finalY: number) => {
    if (isCompletedRef.current) {
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      return;
    }

    const currentX = startPositionRef.current.x + finalX + cardSize / 2;
    const currentY = startPositionRef.current.y + finalY + cardSize / 2;

    const topCategory = topCategoryPositionRef.current;
    const bottomCategory = bottomCategoryPositionRef.current;

    let bestMatch: { categoryId: number; distance: number } | null = null;

    // Check top category
    if (topCategory) {
      const centerX = topCategory.x + topCategory.width / 2;
      const centerY = topCategory.y + topCategory.height / 2;
      const dist = Math.sqrt(
        Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2)
      );
      if (dist < dropThreshold) {
        bestMatch = { categoryId: topCategoryId, distance: dist };
      }
    }

    // Check bottom category
    if (bottomCategory) {
      const centerX = bottomCategory.x + bottomCategory.width / 2;
      const centerY = bottomCategory.y + bottomCategory.height / 2;
      const dist = Math.sqrt(
        Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2)
      );
      if (dist < dropThreshold && (!bestMatch || dist < bestMatch.distance)) {
        bestMatch = { categoryId: bottomCategoryId, distance: dist };
      }
    }

    if (bestMatch) {
      // Check if correct category
      const isCorrect = item.categoryId === bestMatch.categoryId;
      
      // Debug logging
      console.log('Drop check:', {
        itemId: item.id,
        itemWord: item.word,
        itemCategoryId: item.categoryId,
        dropCategoryId: bestMatch.categoryId,
        isCorrect,
        topCategoryId,
        bottomCategoryId
      });
      
      if (isCorrect) {
        // Correct drop - hide card (it will appear in category section)
        opacity.value = withTiming(0, { duration: 200 });
        // Don't reset position - let it stay where it was dropped
        runOnJS(onCorrectDrop)(item.id, bestMatch.categoryId);
      } else {
        // Wrong drop - shake and return
        runOnJS(onWrongDrop)();
        shake.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    } else {
      // Not dropped on any category - return to center
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
    }
  }, [item.id, item.categoryId, cardSize, dropThreshold, topCategoryId, bottomCategoryId, onCorrectDrop, onWrongDrop]);

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        scale.value = withSpring(1.1, { damping: 12 });
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

  const shakeStyle = useAnimatedStyle(() => ({
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
        style={[styles.card, styles.draggableCard, cardDynamicStyle, shakeStyle]}
        onLayout={measureCard}
      >
        {item.imageUrl ? (
          <ImageWithLoader
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: Colors.backgroundDark }]} />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.padding.lg,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  title: {
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: -20,
  },
  question: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
    alignSelf: 'center',
  },
  categorySection: {
    marginVertical: Spacing.margin.sm,
    minHeight: 90,
    maxHeight: 100,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.margin.sm,
    minHeight: 200,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  dropZone: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.md,
    padding: Spacing.padding.sm,
    paddingVertical: Spacing.padding.md,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  categoryTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.margin.xs,
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.md,
  },
  dropZoneItems: {
    flexDirection: 'row',
    gap: Spacing.gap.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placedCard: {
    borderRadius: Spacing.radius.md,
    overflow: 'hidden',
    borderWidth: Spacing.borderWidth.thick,
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  placedImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCard: {
    borderRadius: Spacing.radius.md,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.borderDashed,
    borderStyle: 'dashed',
    backgroundColor: Colors.backgroundDark,
  },
  card: {
    borderRadius: Spacing.radius.lg,
    overflow: 'hidden',
  },
  draggableCard: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    textAlign: 'center',
    padding: Spacing.padding.lg,
  },
});


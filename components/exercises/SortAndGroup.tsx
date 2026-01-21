import { AVPlaybackStatus, Audio as ExpoAudio } from "expo-av";
import * as Haptics from "expo-haptics";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { Colors, Spacing, Typography } from "../../constants";
import { categories, Exercise, Item } from "../../data/data";
import { PopulatedExercise } from "../../lib/api/exercises";
import { items } from "../../lib/items-store";
import { useTranslation } from "../../lib/localization";
import { DuoButton } from "../DuoButton";
import { Body, Title } from "../Typography";
import ImageWithLoader from "../common/ImageWithLoader";

interface SortAndGroupProps {
  exercise: Exercise;
  onComplete: (isCorrect?: boolean) => void;
  apiExercise?: PopulatedExercise;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Calculate card size for center grid (up to 3x2)
const getCardSize = (itemCount: number) => {
  const containerPadding = 48; // Match styles.container padding (24 * 2)
  const gap = 16;
  const numColumns = itemCount > 4 ? 3 : 2;
  const availableWidth = SCREEN_WIDTH - containerPadding;
  const calculatedSize = Math.floor(
    (availableWidth - (numColumns - 1) * gap) / numColumns
  );
  const minSize = 90;
  const maxSize = numColumns === 3 ? 100 : 120;
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

export default React.memo(function SortAndGroup({
  exercise,
  onComplete,
  apiExercise,
}: SortAndGroupProps) {
  // #region agent log
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  const [sound, setSound] = useState<any>(null); // Kept for legacy if needed elsewhere, but questionSound is preferred
  const [questionSound, setQuestionSound] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isUnmountingRef = useRef(false);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.setOnPlaybackStatusUpdate(null);
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const playQuestionAudio = async () => {
    if (!exercise.questionAudioUrl) return;

    try {
      if (questionSound) {
        try {
          await questionSound.stopAsync();
          await questionSound.unloadAsync();
        } catch (e) {}
        setQuestionSound(null);
      }

      setIsPlaying(true);
      const { sound: newSound } = await ExpoAudio.Sound.createAsync(
        { uri: exercise.questionAudioUrl },
        { shouldPlay: true }
      );

      setQuestionSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (isUnmountingRef.current) return;
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
    } catch (error) {
      setIsPlaying(false);
      console.error("Failed to play question audio:", error);
    }
  };

  useEffect(() => {
    fetch("http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "SortAndGroup.tsx:mount",
        message: "Component mounted",
        data: {
          componentId: componentId.current,
          stageId: exercise.stageId,
          order: exercise.order,
          optionIds: exercise.optionIds,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H1,H5",
      }),
    }).catch(() => {});
    return () => {
      fetch(
        "http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "SortAndGroup.tsx:unmount",
            message: "Component unmounting",
            data: { componentId: componentId.current },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H1,H5",
          }),
        }
      ).catch(() => {});
    };
  }, []);
  // #endregion

  const { t } = useTranslation();

  // Get items for this exercise
  const exerciseItems = useMemo(() => {
    const foundItems = exercise.optionIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined);

    // Log if some items weren't found
    if (foundItems.length !== exercise.optionIds.length) {
      const missingIds = exercise.optionIds.filter(
        (id) => !items.find((item) => item.id === id)
      );
      console.warn("SortAndGroup: Some items not found in store:", {
        expected: exercise.optionIds.length,
        found: foundItems.length,
        missingIds,
      });
    }

    return foundItems;
  }, [exercise.optionIds]);

  const CARD_SIZE = useMemo(() => getCardSize(exerciseItems.length), [exerciseItems.length]);
  const CATEGORY_CARD_SIZE = useMemo(
    () => getCategoryCardSize(CARD_SIZE),
    [CARD_SIZE]
  );
  const DROP_THRESHOLD = CARD_SIZE * 0.7;

  // Group items by category
  const categoryGroups = useMemo(() => {
    const groups = new Map<number, Item[]>();
    exerciseItems.forEach((item) => {
      const categoryId = item.categoryId;
      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(item);
    });

    const grouped = Array.from(groups.entries());

    return grouped;
  }, [exerciseItems]);

  // Extract category titles from API exercise data
  const categoryTitleMap = useMemo(() => {
    const map = new Map<number, string>();
    if (apiExercise?.options && exerciseItems.length > 0) {
      // Create a map of option _id to numeric item id
      const optionIdToItemIdMap = new Map<string | {}, number>();
      apiExercise.options.forEach((option, index) => {
        // Items are mapped with sequential IDs (1, 2, 3...) based on options array order
        optionIdToItemIdMap.set(option._id, index + 1);
      });

      // Match each option to its item and extract category title
      apiExercise.options.forEach((option) => {
        const itemId = optionIdToItemIdMap.get(option._id);
        if (itemId) {
          const item = exerciseItems.find((item) => item.id === itemId);
          if (item && option.category?.title) {
            map.set(item.categoryId, option.category.title);
          }
        }
      });
    }
    return map;
  }, [apiExercise, exerciseItems]);

  // Should have exactly 2 categories with 2-4 total options (at least 1 per category)
  const [category1, category2, isValid, validationError] = useMemo(() => {
    const totalOptions = exerciseItems.length;
    const numCategories = categoryGroups.length;

    // Debug logging

    // Validate: exactly 2 categories
    if (numCategories !== 2) {
      const categoryDetails = categoryGroups
        .map(([id, items]) =>
          t("exercise.categoryDetails", { id, count: items.length })
        )
        .join(", ");
      return [
        null,
        null,
        false,
        t("exercise.expectedTwoCategories", {
          found: numCategories,
          details: categoryDetails,
        }),
      ];
    }

    // Validate: total options must be 2-6
    if (totalOptions < 2 || totalOptions > 6) {
      return [
        null,
        null,
        false,
        t("exercise.expectedTwoToSixOptions", { found: totalOptions }),
      ];
    }

    const [cat1Id, cat1Items] = categoryGroups[0];
    const [cat2Id, cat2Items] = categoryGroups[1];

    // Validate: each category must have at least 1 item
    if (cat1Items.length === 0 || cat2Items.length === 0) {
      return [
        null,
        null,
        false,
        t("exercise.categoryItemCount", {
          cat1Count: cat1Items.length,
          cat2Count: cat2Items.length,
        }),
      ];
    }

    // Get category titles from API data, fallback to static categories
    const cat1Title =
      categoryTitleMap.get(cat1Id) ||
      categories.find((c) => c.id === cat1Id)?.title ||
      "";
    const cat2Title =
      categoryTitleMap.get(cat2Id) ||
      categories.find((c) => c.id === cat2Id)?.title ||
      "";

    return [
      { id: cat1Id, title: cat1Title, items: cat1Items },
      { id: cat2Id, title: cat2Title, items: cat2Items },
      true,
      null,
    ];
  }, [categoryGroups, exerciseItems, exercise.optionIds, categoryTitleMap]);

  // Shuffled items for center grid
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);

  // Track which items are in which category (itemId -> categoryId or null if in center)
  const [itemPlacements, setItemPlacements] = useState<
    Map<number, number | null>
  >(new Map());

  // Track if completed
  const [isCompleted, setIsCompleted] = useState(false);

  // Guard to prevent multiple onComplete calls
  const isCompletedRef = useRef(false);
  const wrongDropCountRef = useRef(0);
  const isInitializingRef = useRef(false);

  // Store onComplete callback in ref to avoid it triggering completion check useEffect
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Position refs for category drop zones
  const topCategoryPositionRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const bottomCategoryPositionRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Initialize items in center - runs on every mount or when exercise/items/categories change
  // Include exercise stageId and order to ensure reset when returning to same stage
  useEffect(() => {
    if (!category1 || !category2) return;

    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "SortAndGroup.tsx:init-start",
        message: "Init useEffect START",
        data: {
          componentId: componentId.current,
          stageId: exercise.stageId,
          order: exercise.order,
          exerciseItemsCount: exerciseItems.length,
          exerciseItemsIds: exerciseItems.map((i) => i.id),
          isInitializingBefore: isInitializingRef.current,
          isCompletedBefore: isCompleted,
          isCompletedRefBefore: isCompletedRef.current,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H1,H2,H3",
      }),
    }).catch(() => {});
    // #endregion

    // Set initializing flag to prevent completion check during reset
    isInitializingRef.current = true;

    const shuffled = shuffleArray(exerciseItems);
    setShuffledItems(shuffled);

    // Initialize all items as being in center (null)
    const placements = new Map<number, number | null>();
    exerciseItems.forEach((item) => {
      placements.set(item.id, null);
    });
    setItemPlacements(placements);
    setIsCompleted(false);
    isCompletedRef.current = false;
    wrongDropCountRef.current = 0;

    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "SortAndGroup.tsx:init-end",
        message: "Init useEffect END",
        data: {
          componentId: componentId.current,
          placementsSize: placements.size,
          placementsEntries: Array.from(placements.entries()),
          isInitializingAfter: isInitializingRef.current,
          isCompletedRefAfter: isCompletedRef.current,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H1,H2",
      }),
    }).catch(() => {});
    // #endregion
  }, [exercise.stageId, exercise.order, exerciseItems, category1, category2]);

  // Clear initializing flag AFTER state updates have settled
  // This runs in a separate useEffect to ensure it runs after the completion check has seen the flag
  useEffect(() => {
    if (
      isInitializingRef.current &&
      !isCompleted &&
      isCompletedRef.current === false
    ) {
      // Use a longer delay to ensure all state updates and re-renders have completed
      const timer = setTimeout(() => {
        isInitializingRef.current = false;

        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "SortAndGroup.tsx:clear-init-flag",
              message: "isInitializingRef cleared after state settled",
              data: {
                componentId: componentId.current,
                isInitializing: isInitializingRef.current,
                isCompleted: isCompleted,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              hypothesisId: "H2",
            }),
          }
        ).catch(() => {});
        // #endregion
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [itemPlacements, isCompleted]);

  // Check if all items are correctly placed
  const checkCompletion = useCallback(() => {
    if (!category1 || !category2) return false;

    let allCorrect = true;
    exerciseItems.forEach((item) => {
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
    // #region agent log
    const completionResult = checkCompletion();
    fetch("http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "SortAndGroup.tsx:completion-check",
        message: "Completion check useEffect triggered",
        data: {
          componentId: componentId.current,
          isInitializing: isInitializingRef.current,
          completionResult: completionResult,
          isCompleted: isCompleted,
          isCompletedRef: isCompletedRef.current,
          itemPlacementsEntries: Array.from(itemPlacements.entries()),
          exerciseItemsIds: exerciseItems.map((i) => ({
            id: i.id,
            categoryId: i.categoryId,
          })),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H1,H2,H3",
      }),
    }).catch(() => {});
    // #endregion

    // Don't check completion during initialization
    if (isInitializingRef.current) {
      return;
    }

    if (checkCompletion() && !isCompleted && !isCompletedRef.current) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "SortAndGroup.tsx:calling-onComplete",
            message: "Calling onComplete(true)",
            data: { componentId: componentId.current },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H5",
          }),
        }
      ).catch(() => {});
      // #endregion

      // Mark as completed immediately
      isCompletedRef.current = true;
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Call onComplete with isCorrect = true (default)
      onCompleteRef.current(true);
    }
  }, [itemPlacements, checkCompletion, isCompleted]);

  const handleCorrectDrop = useCallback(
    (itemId: number, categoryId: number) => {
      setItemPlacements((prev) => {
        const newPlacements = new Map(prev);
        newPlacements.set(itemId, categoryId);
        return newPlacements;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    []
  );

  const handleWrongDrop = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Increment wrong drop counter
    wrongDropCountRef.current += 1;

    // Call onComplete(false) after 6 wrong drops to show confetti celebration
    if (wrongDropCountRef.current >= 6 && !isCompletedRef.current) {
      isCompletedRef.current = true;
      onCompleteRef.current(false);
    }
  }, []);

  const registerTopCategoryPosition = useCallback(
    (x: number, y: number, width: number, height: number) => {
      topCategoryPositionRef.current = { x, y, width, height };
    },
    []
  );

  const registerBottomCategoryPosition = useCallback(
    (x: number, y: number, width: number, height: number) => {
      bottomCategoryPositionRef.current = { x, y, width, height };
    },
    []
  );

  // Memoize items in each category to prevent unnecessary re-renders
  const itemsInCategory1 = useMemo(() => {
    if (!category1) return [];
    return exerciseItems.filter(
      (item) => itemPlacements.get(item.id) === category1.id
    );
  }, [exerciseItems, itemPlacements, category1]);

  const itemsInCategory2 = useMemo(() => {
    if (!category2) return [];
    return exerciseItems.filter(
      (item) => itemPlacements.get(item.id) === category2.id
    );
  }, [exerciseItems, itemPlacements, category2]);

  // Show error if validation failed (isValid is false) or if categories aren't set
  if (isValid === false || !category1 || !category2) {
    return (
      <View style={styles.container}>
        <Body style={styles.errorText}>
          {t("exercise.invalidExercise")}
          {validationError && `\n${validationError}`}
        </Body>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title size="small" style={styles.title}>
        {t("exercise.sortAndGroup")}
      </Title>
      <View style={styles.questionContainer}>
        <Body size="large" style={styles.question}>
          {exercise.question}
        </Body>
        {exercise.questionAudioUrl && (
          <DuoButton
            title=""
            onPress={playQuestionAudio}
            color="blue"
            size="medium"
            customSize={54}
            style={styles.audioButton}
            icon={isPlaying ? "pause" : "play"}
            shape="circle"
            iconSize={26}
          />
        )}
      </View>

      {/* Top Category Section */}
      <View style={styles.categorySection}>
        <CategoryDropZone
          category={category1}
          cardSize={CATEGORY_CARD_SIZE}
          onLayout={registerTopCategoryPosition}
          isCompleted={isCompleted}
          itemsInCategory={itemsInCategory1}
        />
      </View>

      {/* Center Grid - Draggable Items */}
      <View style={styles.centerSection}>
        <View
          style={[
            styles.grid,
            {
              width:
                exerciseItems.length > 4
                  ? CARD_SIZE * 3 + 32
                  : CARD_SIZE * 2 + 16,
            },
          ]}
        >
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
          itemsInCategory={itemsInCategory2}
        />
      </View>
    </View>
  );
});

// Category Drop Zone Component
interface CategoryDropZoneProps {
  category: { id: number; title: string; items: Item[] };
  cardSize: number;
  onLayout: (x: number, y: number, width: number, height: number) => void;
  isCompleted: boolean;
  itemsInCategory: Item[];
}

const CategoryDropZone = React.memo(function CategoryDropZone({
  category,
  cardSize,
  onLayout,
  isCompleted,
  itemsInCategory,
}: CategoryDropZoneProps) {
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
    event.target.measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        onLayout(x, y, width, height);
      }
    );
  };

  return (
    <Animated.View
      style={[styles.dropZone, animatedStyle]}
      onLayout={handleLayout}
    >
      {category.title && (
        <Body size="medium" weight="medium" style={styles.categoryTitle}>
          {category.title}
        </Body>
      )}
      <View style={styles.dropZoneItems}>
        {itemsInCategory.map((item) => (
          <View
            key={item.id}
            style={[styles.placedCard, { width: cardSize, height: cardSize }]}
          >
            {item.imageUrl && (
              <ImageWithLoader
                key={`image-${item.id}-${item.imageUrl}`}
                source={{ uri: item.imageUrl }}
                style={styles.placedImage}
                resizeMode="cover"
              />
            )}
          </View>
        ))}
        {/* Show placeholders for missing items */}
        {Array.from({
          length: expectedItemsCount - itemsInCategory.length,
        }).map((_, index) => (
          <View
            key={`placeholder-${index}`}
            style={[
              styles.placeholderCard,
              { width: cardSize, height: cardSize },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
});

// Draggable Card Component
interface DraggableCardProps {
  item: Item;
  cardSize: number;
  dropThreshold: number;
  topCategoryPositionRef: React.MutableRefObject<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>;
  bottomCategoryPositionRef: React.MutableRefObject<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>;
  topCategoryId: number;
  bottomCategoryId: number;
  onCorrectDrop: (itemId: number, categoryId: number) => void;
  onWrongDrop: () => void;
  isCompleted: boolean;
}

const DraggableCard = React.memo(function DraggableCard({
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

  const checkDropAndHandle = useCallback(
    (absoluteX: number, absoluteY: number) => {
      if (isCompletedRef.current) {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        return;
      }

      const currentX = absoluteX;
      const currentY = absoluteY;

      const topCategory = topCategoryPositionRef.current;
      const bottomCategory = bottomCategoryPositionRef.current;

      let bestMatch: { categoryId: number; distance: number } | null = null;

      // Improved drop detection: Check if touch point is inside the category rectangle
      // Fallback to center distance for better UX near edges

      // Check top category
      if (topCategory) {
        const isInside =
          currentX >= topCategory.x &&
          currentX <= topCategory.x + topCategory.width &&
          currentY >= topCategory.y &&
          currentY <= topCategory.y + topCategory.height;

        const centerX = topCategory.x + topCategory.width / 2;
        const centerY = topCategory.y + topCategory.height / 2;
        const dist = Math.sqrt(
          Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2)
        );

        if (isInside || dist < dropThreshold) {
          bestMatch = { categoryId: topCategoryId, distance: dist };
        }
      }

      // Check bottom category
      if (bottomCategory) {
        const isInside =
          currentX >= bottomCategory.x &&
          currentX <= bottomCategory.x + bottomCategory.width &&
          currentY >= bottomCategory.y &&
          currentY <= bottomCategory.y + bottomCategory.height;

        const centerX = bottomCategory.x + bottomCategory.width / 2;
        const centerY = bottomCategory.y + bottomCategory.height / 2;
        const dist = Math.sqrt(
          Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2)
        );

        if (isInside || dist < dropThreshold) {
          if (!bestMatch || dist < bestMatch.distance) {
            bestMatch = { categoryId: bottomCategoryId, distance: dist };
          }
        }
      }

      if (bestMatch) {
        // Check if correct category
        const isCorrect = item.categoryId === bestMatch.categoryId;

        // Debug logging

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
    },
    [
      item.id,
      item.categoryId,
      dropThreshold,
      topCategoryId,
      bottomCategoryId,
      onCorrectDrop,
      onWrongDrop,
    ]
  );

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
        runOnJS(checkDropAndHandle)(e.absoluteX, e.absoluteY);
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
        style={[
          styles.card,
          styles.draggableCard,
          cardDynamicStyle,
          shakeStyle,
        ]}
        onLayout={measureCard}
      >
        {item.imageUrl ? (
          <ImageWithLoader
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.cardImage,
              { backgroundColor: Colors.backgroundDark },
            ]}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    paddingHorizontal: Spacing.padding.lg,
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  title: {
    color: "#FF1493",
    textAlign: "center",
    marginBottom: 8,
    marginTop: -20,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 12,
    width: "100%",
  },
  question: {
    color: "#666",
    textAlign: "center",
    maxWidth: "80%",
    fontSize: 28,
  },
  audioButton: {
    // Styling for the audio button if needed beyond DuoButton props
  },
  categorySection: {
    marginVertical: Spacing.margin.sm,
    minHeight: 110,
  },
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: Spacing.margin.sm,
    minHeight: 200,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  dropZone: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.md,
    padding: Spacing.padding.sm,
    paddingVertical: Spacing.padding.md,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  categoryTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.margin.xs,
    marginTop: Spacing.margin.xs,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  dropZoneItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.gap.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  placedCard: {
    borderRadius: Spacing.radius.md,
    overflow: "hidden",
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
    width: "100%",
    height: "100%",
  },
  placeholderCard: {
    borderRadius: Spacing.radius.md,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.borderDashed,
    borderStyle: "dashed",
    backgroundColor: Colors.backgroundDark,
  },
  card: {
    borderRadius: Spacing.radius.lg,
    overflow: "hidden",
  },
  draggableCard: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    textAlign: "center",
    padding: Spacing.padding.lg,
  },
});

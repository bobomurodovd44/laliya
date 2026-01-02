import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import ConfettiCannon from "react-native-confetti-cannon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DuoButton } from "../components/DuoButton";
import LookAndSay from "../components/exercises/LookAndSay";
import ListenAndPick from "../components/exercises/ListenAndPick";
import OddOneOut from "../components/exercises/OddOneOut";
import PicturePuzzle from "../components/exercises/PicturePuzzle";
import ShapeMatch from "../components/exercises/ShapeMatch";
import SortAndGroup from "../components/exercises/SortAndGroup";
import { PageContainer } from "../components/layout/PageContainer";
import { ProgressBar } from "../components/ProgressBar";
import { Body } from "../components/Typography";
import { Colors, Spacing } from "../constants";
import { Exercise, ExerciseType } from "../data/data";
import {
  fetchExercisesByStageId,
  mapPopulatedExerciseToExercise,
} from "../lib/api/exercises";
import {
  getCachedExercises,
  setCachedExercises,
} from "../lib/cache/exercises-cache";
import { items, setItems } from "../lib/items-store";

export default function Task() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const stageId = params.stageId as string;
  const exerciseOrder = Number(params.exerciseOrder) || 1;

  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [stageExercises, setStageExercises] = useState<Exercise[]>([]);
  const [isLastExercise, setIsLastExercise] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const confettiRef = useRef<ConfettiCannon>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletingRef = useRef(false);

  useEffect(() => {
    // Reset state immediately before async operations to prevent stale state
    setIsCompleted(false);
    setError(null);

    if (!stageId) {
      setError("Stage ID is required");
      setLoading(false);
      setCurrentExercise(null);
      return;
    }

    // Check cache first
    const cached = getCachedExercises(stageId);
    
    if (cached) {
      // Use cached data - no loading needed
      console.log("[Task] Using cached exercises for stageId:", stageId);
      
      setStageExercises(cached.exercises);
      
      // Find current exercise by array index (exerciseOrder is 1-based, so subtract 1)
      const exerciseIndex = exerciseOrder - 1;
      
      if (exerciseIndex >= 0 && exerciseIndex < cached.exercises.length) {
        const exercise = cached.exercises[exerciseIndex];
        setCurrentExercise(exercise);
        setIsLastExercise(exerciseOrder >= cached.exercises.length);
        isCompletingRef.current = false;
        
        // Map and set items for the current exercise
        const currentApiExercise = cached.apiExercises[exerciseIndex];
        if (currentApiExercise) {
          const { items: exerciseItems } =
            mapPopulatedExerciseToExercise(currentApiExercise);
          setItems(exerciseItems);
        }
        
        setLoading(false);
        return;
      } else {
        console.error("[Task] Exercise index out of bounds:", exerciseIndex, "length:", cached.exercises.length);
        setError(`Exercise not found (requested index ${exerciseOrder}, but only ${cached.exercises.length} exercises available)`);
        setLoading(false);
        setCurrentExercise(null);
        return;
      }
    }

    // No cache - fetch from API
    setCurrentExercise(null);
    setLoading(true);

    const loadExercises = async () => {
      try {
        console.log("[Task] Loading exercises for stageId:", stageId, "exerciseOrder:", exerciseOrder);

        // Fetch exercises from API
        const apiExercises = await fetchExercisesByStageId(stageId);

        console.log("[Task] Fetched", apiExercises.length, "exercises from API");

        if (apiExercises.length === 0) {
          console.warn("[Task] No exercises found for stageId:", stageId);
          setError("No exercises found for this stage");
          setLoading(false);
          return;
        }

        // Map all exercises
        const mappedExercises: Exercise[] = [];
        apiExercises.forEach((apiExercise) => {
          const { exercise } = mapPopulatedExerciseToExercise(apiExercise);
          mappedExercises.push(exercise);
        });

        console.log("[Task] Mapped", mappedExercises.length, "exercises. Orders:", mappedExercises.map(e => e.order));

        // Cache the exercises
        setCachedExercises(stageId, mappedExercises, apiExercises);

        setStageExercises(mappedExercises);

        // Find current exercise by array index (exerciseOrder is 1-based, so subtract 1)
        const exerciseIndex = exerciseOrder - 1;
        
        console.log("[Task] Looking for exercise at index:", exerciseIndex, "out of", mappedExercises.length);
        
        if (exerciseIndex < 0 || exerciseIndex >= mappedExercises.length) {
          console.error("[Task] Exercise index out of bounds:", exerciseIndex, "length:", mappedExercises.length);
          setError(`Exercise not found (requested index ${exerciseOrder}, but only ${mappedExercises.length} exercises available)`);
          setLoading(false);
          return;
        }

        const exercise = mappedExercises[exerciseIndex];
        
        console.log("[Task] Found exercise:", exercise.order, exercise.type);

        if (!exercise) {
          setError("Exercise not found");
          setLoading(false);
          return;
        }

        // Map and set items for the current exercise
        const currentApiExercise = apiExercises[exerciseIndex];
        if (currentApiExercise) {
          const { items: exerciseItems } =
            mapPopulatedExerciseToExercise(currentApiExercise);
          setItems(exerciseItems);
        }

        setCurrentExercise(exercise);
        setIsLastExercise(exerciseOrder >= mappedExercises.length);
        setIsCompleted(false);
        isCompletingRef.current = false;
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading exercises:", err);
        setError(err.message || "Failed to load exercises");
        setLoading(false);
      }
    };

    loadExercises();
  }, [stageId, exerciseOrder]);

  // Preload images when exercise changes
  useEffect(() => {
    if (!currentExercise || !items.length) return;

    const imageUrls: string[] = [];

    // Collect all image URLs from exercise items
    if (currentExercise.optionIds) {
      currentExercise.optionIds.forEach((id) => {
        const item = items.find((i) => i.id === id);
        if (item?.imageUrl) {
          imageUrls.push(item.imageUrl);
        }
      });
    }

    // Add answer item image if it exists
    if (currentExercise.answerId) {
      const answerItem = items.find((i) => i.id === currentExercise.answerId);
      if (answerItem?.imageUrl && !imageUrls.includes(answerItem.imageUrl)) {
        imageUrls.push(answerItem.imageUrl);
      }
    }

    // Preload all images
    if (imageUrls.length > 0) {
      imageUrls.forEach((url) => {
        Image.prefetch(url).catch((err) => {
          // Silently fail - images will load normally if prefetch fails
          console.log("Image prefetch failed:", url, err);
        });
      });
    }
  }, [currentExercise]);

  useFocusEffect(
    useCallback(() => {
      // Reset state when page comes into focus (but not on initial mount)
      // This ensures exercises reset when navigating back to the same exercise
      // Only reset if we already have an exercise loaded (not initial load)
      if (currentExercise) {
        setResetKey((prev) => prev + 1);
        setIsCompleted(false);
        isCompletingRef.current = false;
        if (completionTimeoutRef.current) {
          clearTimeout(completionTimeoutRef.current);
          completionTimeoutRef.current = null;
        }
      }
    }, [currentExercise])
  );

  const handleComplete = useCallback(() => {
    // Only allow completion if not loading and exercise exists
    if (loading || !currentExercise || isCompletingRef.current) {
      return;
    }

    // Mark as completing immediately to prevent multiple calls
    isCompletingRef.current = true;

    // Clear any existing timeout
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }

    // Use requestAnimationFrame to ensure UI updates happen first
    requestAnimationFrame(() => {
      setIsCompleted(true);

      // Only trigger confetti if not loading and not LOOK_AND_SAY type
      if (currentExercise.type !== ExerciseType.LOOK_AND_SAY && !loading) {
        // Small delay for confetti to ensure state is updated
        setTimeout(() => {
          confettiRef.current?.start();
        }, 50);
      }
    });
  }, [currentExercise, loading]);

  const renderExercise = () => {
    if (!currentExercise) return null;

    // Create a unique key that includes resetKey to force remount when page is focused
    const exerciseKey = `${currentExercise.stageId}-${currentExercise.order}-${resetKey}`;

    switch (currentExercise.type) {
      case ExerciseType.ODD_ONE_OUT:
        return (
          <OddOneOut
            key={exerciseKey}
            exercise={currentExercise}
            onComplete={handleComplete}
          />
        );
      case ExerciseType.LOOK_AND_SAY:
        return (
          <LookAndSay
            key={exerciseKey}
            exercise={currentExercise}
            onComplete={handleComplete}
          />
        );
      case ExerciseType.SHAPE_MATCH:
        return (
          <ShapeMatch
            key={exerciseKey}
            exercise={currentExercise}
            onComplete={handleComplete}
          />
        );
      case ExerciseType.PICTURE_PUZZLE:
        return (
          <PicturePuzzle
            key={exerciseKey}
            exercise={currentExercise}
            onComplete={handleComplete}
          />
        );
      case ExerciseType.LISTEN_AND_PICK:
        return (
          <ListenAndPick
            key={exerciseKey}
            exercise={currentExercise}
            onComplete={handleComplete}
          />
        );
      case ExerciseType.SORT_AND_GROUP:
        return (
          <SortAndGroup
            key={exerciseKey}
            exercise={currentExercise}
            onComplete={handleComplete}
          />
        );
      default:
        return <Body style={styles.errorText}>Unknown exercise type</Body>;
    }
  };

  const handleNext = useCallback(() => {
    if (!isLastExercise && stageId) {
      router.push(
        `/task?stageId=${stageId}&exerciseOrder=${exerciseOrder + 1}`
      );
    }
  }, [isLastExercise, stageId, exerciseOrder, router]);

  const handleSubmit = useCallback(() => {
    router.push("/");
  }, [router]);

  const progress =
    stageExercises.length > 0 ? exerciseOrder / stageExercises.length : 0;

  if (loading) {
    return (
      <PageContainer>
        <View
          style={[
            styles.errorContainer,
            { paddingTop: insets.top + Spacing.padding.xxl },
          ]}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Body style={styles.loadingText}>Loading exercises...</Body>
        </View>
      </PageContainer>
    );
  }

  if (error || !currentExercise) {
    return (
      <PageContainer>
        <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
          <Body style={styles.errorText}>
            {error || "Exercise not found"}
          </Body>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer useAnimatedBackground>
      <View
        style={[
          styles.progressContainer,
          { paddingTop: insets.top + Spacing.padding.md },
        ]}
      >
        <ProgressBar progress={progress} />
      </View>

      <View style={styles.content}>{renderExercise()}</View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, Spacing.padding.lg) },
        ]}
      >
        {isLastExercise ? (
          <DuoButton
            title="Submit"
            onPress={handleSubmit}
            color="green"
            size="medium"
            disabled={!isCompleted}
          />
        ) : (
          <DuoButton
            title="Next"
            onPress={handleNext}
            color="green"
            size="medium"
            disabled={!isCompleted}
          />
        )}
      </View>

      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: Dimensions.get("window").width / 2, y: -10 }}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={0}
        fallSpeed={3500}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    width: "100%",
    paddingHorizontal: Spacing.padding.lg,
    paddingVertical: Spacing.padding.lg,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.padding.lg,
  },
  footer: {
    padding: Spacing.padding.lg,
    paddingBottom: Spacing.padding.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: Spacing.size.icon.medium,
    color: Colors.error,
    textAlign: "center",
    padding: Spacing.padding.lg,
  },
  loadingText: {
    marginTop: Spacing.margin.md,
    color: Colors.secondary,
    fontSize: Spacing.size.icon.medium,
  },
});

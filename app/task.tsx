import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, InteractionManager, StyleSheet, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DuoButton } from "../components/DuoButton";
import ListenAndPick from "../components/exercises/ListenAndPick";
import LookAndSay from "../components/exercises/LookAndSay";
import OddOneOut from "../components/exercises/OddOneOut";
import PicturePuzzle from "../components/exercises/PicturePuzzle";
import ShapeMatch from "../components/exercises/ShapeMatch";
import SortAndGroup from "../components/exercises/SortAndGroup";
import { PageContainer } from "../components/layout/PageContainer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ProgressBar } from "../components/ProgressBar";
import { Body } from "../components/Typography";
import { Colors, Spacing } from "../constants";
import { Exercise, ExerciseType } from "../data/data";
import {
  fetchExercisesByStageId,
  mapPopulatedExerciseToExercise,
  PopulatedExercise,
} from "../lib/api/exercises";
import {
  getCachedExercises,
  setCachedExercises,
} from "../lib/cache/exercises-cache";
import { imagePreloader } from "../lib/image-preloader";
import { items, setItems } from "../lib/items-store";

export default function Task() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const stageId = params.stageId as string;
  const exerciseOrder = Number(params.exerciseOrder) || 1;

  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [stageExercises, setStageExercises] = useState<Exercise[]>([]);
  const [apiExercises, setApiExercises] = useState<PopulatedExercise[]>([]);
  const [isLastExercise, setIsLastExercise] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const confettiRef = useRef<ConfettiCannon>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletingRef = useRef(false);
  const previousExerciseOrderRef = useRef<number | null>(null);
  const isInitialMountRef = useRef(true);

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
      setStageExercises(cached.exercises);
      setApiExercises(cached.apiExercises);

      // Find current exercise by array index (exerciseOrder is 1-based, so subtract 1)
      const exerciseIndex = exerciseOrder - 1;

      if (exerciseIndex >= 0 && exerciseIndex < cached.exercises.length) {
        const exercise = cached.exercises[exerciseIndex];
        setCurrentExercise(exercise);
        setIsLastExercise(exerciseOrder >= cached.exercises.length);
        isCompletingRef.current = false;
        previousExerciseOrderRef.current = exerciseOrder;

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
        setError(
          `Exercise not found (requested index ${exerciseOrder}, but only ${cached.exercises.length} exercises available)`
        );
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
        // Fetch exercises from API
        const apiExercises = await fetchExercisesByStageId(stageId);

        if (apiExercises.length === 0) {
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

        // Cache the exercises
        setCachedExercises(stageId, mappedExercises, apiExercises);

        setStageExercises(mappedExercises);
        setApiExercises(apiExercises);

        // Find current exercise by array index (exerciseOrder is 1-based, so subtract 1)
        const exerciseIndex = exerciseOrder - 1;

        if (exerciseIndex < 0 || exerciseIndex >= mappedExercises.length) {
          setError(
            `Exercise not found (requested index ${exerciseOrder}, but only ${mappedExercises.length} exercises available)`
          );
          setLoading(false);
          return;
        }

        const exercise = mappedExercises[exerciseIndex];

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
        previousExerciseOrderRef.current = exerciseOrder;
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load exercises");
        setLoading(false);
      }
    };

    loadExercises();
  }, [stageId, exerciseOrder]);

  // Preload images when exercise changes - use InteractionManager to prevent blocking
  useEffect(() => {
    if (!currentExercise || !items.length || !stageExercises.length) return;

    // Defer image preloading to prevent blocking UI
    const interaction = InteractionManager.runAfterInteractions(() => {
      const imageUrls: string[] = [];

      // Collect all image URLs from current exercise items
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

      // Preload current exercise images with high priority
      if (imageUrls.length > 0) {
        imagePreloader.preloadBatch(imageUrls, "high").catch(() => {
          // Silently fail - images will load normally if prefetch fails
        });
      }

      // Preload next exercise images in background (if exists)
      const currentIndex = exerciseOrder - 1;
      const nextApiExercise = apiExercises[currentIndex + 1];

      if (nextApiExercise) {
        const nextImageUrls: string[] = [];

        // Extract image URLs from next exercise's API data
        if (nextApiExercise.options) {
          nextApiExercise.options.forEach((option) => {
            if (option.img?.name) {
              nextImageUrls.push(option.img.name);
            }
          });
        }

        // Add next exercise answer image if it exists
        if (nextApiExercise.answer?.img?.name) {
          if (!nextImageUrls.includes(nextApiExercise.answer.img.name)) {
            nextImageUrls.push(nextApiExercise.answer.img.name);
          }
        }

        // Preload next exercise images with normal priority (background)
        if (nextImageUrls.length > 0) {
          imagePreloader.preloadBatch(nextImageUrls, "normal").catch(() => {
            // Silently fail - images will load normally if prefetch fails
          });
        }
      }
    });

    return () => {
      interaction.cancel();
    };
  }, [currentExercise, exerciseOrder, stageExercises, apiExercises]);

  useFocusEffect(
    useCallback(() => {
      // Skip on initial mount
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        previousExerciseOrderRef.current = exerciseOrder;
        return;
      }

      // Only reset if we're returning to the same exercise (not navigating to a new one)
      // This prevents unnecessary remounting when navigating between exercises
      const isSameExercise = previousExerciseOrderRef.current === exerciseOrder;

      if (isSameExercise && currentExercise) {
        // Reset state only when returning to the same exercise
        setResetKey((prev) => prev + 1);
        setIsCompleted(false);
        isCompletingRef.current = false;
        if (completionTimeoutRef.current) {
          clearTimeout(completionTimeoutRef.current);
          completionTimeoutRef.current = null;
        }
      } else {
        // Update the ref when exercise changes
        previousExerciseOrderRef.current = exerciseOrder;
      }
    }, [currentExercise, exerciseOrder])
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

    // Enable button immediately for instant feedback
    setIsCompleted(true);

    // Defer confetti with InteractionManager to prevent blocking UI
    // This ensures button state updates complete before starting heavy animation
    if (currentExercise.type !== ExerciseType.LOOK_AND_SAY && !loading) {
      // Use InteractionManager to defer until after interactions complete
      InteractionManager.runAfterInteractions(() => {
        // Add small delay to ensure button render completes
        setTimeout(() => {
          confettiRef.current?.start();
        }, 100);
      });
    }
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
            styles.loadingContainer,
            { paddingTop: insets.top + Spacing.padding.xxl },
          ]}
        >
          <LoadingSpinner message="Loading exercises..." size="large" />
        </View>
      </PageContainer>
    );
  }

  if (error || !currentExercise) {
    return (
      <PageContainer>
        <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
          <Body style={styles.errorText}>{error || "Exercise not found"}</Body>
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
        count={100}
        origin={{ x: Dimensions.get("window").width / 2, y: -10 }}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={0}
        fallSpeed={3000}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});

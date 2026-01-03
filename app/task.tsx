import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  clearExercisesCache,
  getCachedExercises,
  setCachedExercises,
} from "../lib/cache/exercises-cache";
import { getCachedStages } from "../lib/cache/stages-cache";
import app from "../lib/feathers/feathers-client";
import { imagePreloader } from "../lib/image-preloader";
import { setItems } from "../lib/items-store";
import { useAuthStore } from "../lib/store/auth-store";
import {
  checkStageAccess,
  getUserMaxStageOrder,
} from "../lib/utils/stage-access";
import { uploadAudioMultipart } from "../lib/upload/multipart-upload";

export default function Task() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user, setAuthenticated } = useAuthStore();

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
  const previousStageIdRef = useRef<string | null>(null);
  const currentStageIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);
  const stageAccessCacheRef = useRef<Map<string, boolean>>(new Map());
  const recordedAudioUriRef = useRef<string | null>(null);

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

    // If stageId changed, clear old stage cache and show loading immediately
    const stageIdChanged =
      previousStageIdRef.current && previousStageIdRef.current !== stageId;

    if (stageIdChanged && previousStageIdRef.current) {
      // Clear old stage cache to prevent showing old exercises
      clearExercisesCache(previousStageIdRef.current);
      // Clear current exercise immediately to prevent flash of old content
      // Do this synchronously before any async operations
      setCurrentExercise(null);
      setStageExercises([]);
      setApiExercises([]);
      setLoading(true);
      // Reset completion state
      setIsCompleted(false);
      setResetKey((prev) => prev + 1);
      // Clear current stageId ref to prevent rendering old exercises
      currentStageIdRef.current = null;
      // Clear recorded audio URI when stage changes
      recordedAudioUriRef.current = null;
    }
    previousStageIdRef.current = stageId;

    // Check stage access before loading exercises (cached per stageId)
    const verifyStageAccess = async () => {
      // Check cache first - only verify if stageId or user's currentStageId changed
      const cacheKey = `${stageId}-${user?.currentStageId || "none"}`;
      const cachedAccess = stageAccessCacheRef.current.get(cacheKey);

      if (cachedAccess !== undefined) {
        if (!cachedAccess) {
          setError(
            "Access denied: This stage is locked. Complete previous stages to unlock."
          );
          setLoading(false);
          setCurrentExercise(null);
          setTimeout(() => {
            router.replace("/");
          }, 2000);
        }
        return cachedAccess;
      }

      try {
        const stage = await app.service("stages").get(stageId);
        const isAccessible = await checkStageAccess(
          stage,
          user?.currentStageId
        );

        // Cache the result
        stageAccessCacheRef.current.set(cacheKey, isAccessible);

        if (!isAccessible) {
          setError(
            "Access denied: This stage is locked. Complete previous stages to unlock."
          );
          setLoading(false);
          setCurrentExercise(null);
          // Redirect to home after a short delay
          setTimeout(() => {
            router.replace("/");
          }, 2000);
          return false;
        }
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to verify stage access");
        setLoading(false);
        setCurrentExercise(null);
        return false;
      }
    };

    // Check cache first - but only if stageId hasn't changed
    const cached = !stageIdChanged ? getCachedExercises(stageId) : null;

    const loadData = async () => {
      // Verify stage access first
      const hasAccess = await verifyStageAccess();
      if (!hasAccess) {
        return;
      }

      // If stageId changed, don't use cache - fetch fresh data
      if (stageIdChanged) {
        setCurrentExercise(null);
        setLoading(true);
      }

      if (cached && !stageIdChanged) {
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
          // Set current stageId ref to allow rendering
          currentStageIdRef.current = stageId;

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
          // Set current stageId ref to allow rendering
          currentStageIdRef.current = stageId;
          setLoading(false);
        } catch (err: any) {
          setError(err.message || "Failed to load exercises");
          setLoading(false);
        }
      };

      await loadExercises();
    };

    loadData();
    // Clear stage access cache when stageId or user's currentStageId changes
    // This ensures we re-verify access when these change
  }, [stageId, exerciseOrder, user?.currentStageId, router]);

  // Preload images when exercise changes - use InteractionManager to prevent blocking
  useEffect(() => {
    if (!currentExercise || !apiExercises.length || !stageExercises.length)
      return;

    // Defer image preloading to prevent blocking UI
    const interaction = InteractionManager.runAfterInteractions(() => {
      const currentIndex = exerciseOrder - 1;
      const currentApiExercise = apiExercises[currentIndex];

      if (!currentApiExercise) return;

      const imageUrls: string[] = [];

      // Extract image URLs from current exercise's API data (more efficient than using items array)
      if (currentApiExercise.options) {
        currentApiExercise.options.forEach((option) => {
          if (option.img?.name && option.img.name.trim() !== "") {
            imageUrls.push(option.img.name);
          }
        });
      }

      // Add current exercise answer image if it exists
      if (
        currentApiExercise.answer?.img?.name &&
        currentApiExercise.answer.img.name.trim() !== ""
      ) {
        if (!imageUrls.includes(currentApiExercise.answer.img.name)) {
          imageUrls.push(currentApiExercise.answer.img.name);
        }
      }

      // Preload current exercise images with high priority
      if (imageUrls.length > 0) {
        imagePreloader.preloadBatch(imageUrls, "high").catch(() => {
          // Silently fail - images will load normally if prefetch fails
        });
      }

      // Preload next exercise images in background (if exists)
      const nextApiExercise = apiExercises[currentIndex + 1];

      if (nextApiExercise) {
        const nextImageUrls: string[] = [];

        // Extract image URLs from next exercise's API data
        if (nextApiExercise.options) {
          nextApiExercise.options.forEach((option) => {
            if (option.img?.name && option.img.name.trim() !== "") {
              nextImageUrls.push(option.img.name);
            }
          });
        }

        // Add next exercise answer image if it exists
        if (
          nextApiExercise.answer?.img?.name &&
          nextApiExercise.answer.img.name.trim() !== ""
        ) {
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
  }, [
    currentExercise,
    exerciseOrder,
    apiExercises.length,
    stageExercises.length,
  ]);

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

  // Helper function to update user score (optimistic update)
  const updateUserScore = useCallback(
    (exerciseScore: number) => {
      // Validate inputs
      if (!user?._id) {
        console.warn("Cannot update score: User not logged in");
        return;
      }

      if (!exerciseScore || exerciseScore <= 0) {
        console.warn(
          "Cannot update score: Invalid exercise score",
          exerciseScore
        );
        return;
      }

      // Calculate new score
      const currentScore = user.score || 0;
      const newScore = currentScore + exerciseScore;

      // Optimistic update: immediately update auth store for instant UI feedback
      setAuthenticated({
        ...user,
        score: newScore,
      });

      // Fire API call in background without blocking navigation
      app
        .service("users")
        .patch(user._id, {
          score: newScore,
        })
        .then((updatedUser) => {
          // Sync with server response to ensure consistency
          setAuthenticated(updatedUser);
        })
        .catch((err: any) => {
          // Log error but don't revert optimistic update (user already navigated)
          // Score will sync correctly on next app load
          console.error("Failed to update user score:", err);
        });
    },
    [user, setAuthenticated]
  );

  const handleComplete = useCallback(async () => {
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

    // Enable button IMMEDIATELY for instant feedback - synchronous state update
    setIsCompleted(true);

    // Start confetti immediately without delays for faster feedback
    // Use requestAnimationFrame to ensure it doesn't block button state update
    if (currentExercise.type !== ExerciseType.LOOK_AND_SAY && !loading) {
      requestAnimationFrame(() => {
        confettiRef.current?.start();
      });
    }


    // Extra safety check: verify stage is still accessible (non-blocking, in background)
    if (stageId) {
      // Don't await - run in background to not block UI
      (async () => {
        try {
          const stage = await app.service("stages").get(stageId);
          const isAccessible = await checkStageAccess(
            stage,
            user?.currentStageId
          );
          if (!isAccessible) {
            setError("Access denied: This stage is locked.");
            router.replace("/");
            return;
          }
        } catch (err) {
          // If check fails, still allow completion (don't block user)
          console.warn("Failed to verify stage access:", err);
        }
      })();
    }
  }, [currentExercise, loading, stageId, user?.currentStageId, router]);

  const renderExercise = useMemo(() => {
    if (!currentExercise) return null;

    // Don't render exercise if it's from a different stage (prevents flash of old content)
    // Compare with the ref to ensure we only render exercises for the current stageId
    if (currentStageIdRef.current !== stageId) return null;

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
            onRecordingComplete={(recordedUri) => {
              // Store recorded URI for later upload
              recordedAudioUriRef.current = recordedUri;
            }}
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
  }, [currentExercise, resetKey, handleComplete, stageId]);

  const handleNext = useCallback(() => {
    if (!isLastExercise && stageId && currentExercise) {
      // Upload audio for LookAndSay exercise in background (non-blocking)
      if (
        currentExercise.type === ExerciseType.LOOK_AND_SAY &&
        recordedAudioUriRef.current &&
        user?._id
      ) {
        // Fire and forget - don't block navigation
        (async () => {
          try {
            // Get exercise ID from API exercises
            const currentApiExercise = apiExercises[exerciseOrder - 1];
            if (!currentApiExercise?._id) {
              console.warn("Exercise ID not found for audio upload");
              return;
            }

            // Convert _id to string (it can be string or ObjectId)
            const exerciseId =
              typeof currentApiExercise._id === "string"
                ? currentApiExercise._id
                : String(currentApiExercise._id);

            // Convert user._id to string
            const userId =
              typeof user._id === "string" ? user._id : String(user._id);

            await uploadAudioMultipart(
              recordedAudioUriRef.current!,
              userId,
              exerciseId
            );
            // Clear recorded URI after upload
            recordedAudioUriRef.current = null;
          } catch (err) {
            // Silent fail - don't block user experience
            console.warn("Failed to upload audio:", err);
          }
        })();
      }

      // Calculate next order immediately
      const nextOrder = exerciseOrder + 1;

      // Navigate IMMEDIATELY for fastest transition
      router.push(`/task?stageId=${stageId}&exerciseOrder=${nextOrder}`);

      // Update user score optimistically (non-blocking, background sync)
      updateUserScore(currentExercise.score);

      // Update state optimistically for instant display (non-blocking)
      const nextIndex = nextOrder - 1;
      if (nextIndex < stageExercises.length && stageExercises.length > 0) {
        const nextExercise = stageExercises[nextIndex];
        if (nextExercise) {
          // Pre-set the next exercise for instant display
          setCurrentExercise(nextExercise);
          setIsLastExercise(nextOrder >= stageExercises.length);

          // Set items immediately if available
          const nextApiExercise = apiExercises[nextIndex];
          if (nextApiExercise) {
            const { items: exerciseItems } =
              mapPopulatedExerciseToExercise(nextApiExercise);
            setItems(exerciseItems);
          }

          // Reset completion state for new exercise
          setIsCompleted(false);
          setResetKey((prev) => prev + 1);
          // Clear recorded audio URI when moving to next exercise
          recordedAudioUriRef.current = null;
        }
      }
    }
  }, [
    isLastExercise,
    stageId,
    exerciseOrder,
    router,
    currentExercise,
    updateUserScore,
    stageExercises,
    apiExercises,
    user?._id,
  ]);

  const handleSubmit = useCallback(async () => {
    // Upload audio for LookAndSay exercise in background (non-blocking)
    if (
      currentExercise?.type === ExerciseType.LOOK_AND_SAY &&
      recordedAudioUriRef.current &&
      user?._id
    ) {
      // Fire and forget - don't block navigation
      (async () => {
        try {
          // Get exercise ID from API exercises
          const currentApiExercise = apiExercises[exerciseOrder - 1];
          if (!currentApiExercise?._id) {
            console.warn("Exercise ID not found for audio upload");
            return;
          }

          // Convert _id to string (it can be string or ObjectId)
          const exerciseId =
            typeof currentApiExercise._id === "string"
              ? currentApiExercise._id
              : String(currentApiExercise._id);

          // Convert user._id to string
          const userId =
            typeof user._id === "string" ? user._id : String(user._id);

          await uploadAudioMultipart(
            recordedAudioUriRef.current!,
            userId,
            exerciseId
          );
          // Clear recorded URI after upload
          recordedAudioUriRef.current = null;
        } catch (err) {
          // Silent fail - don't block user experience
          console.warn("Failed to upload audio:", err);
        }
      })();
    }

    // Navigate IMMEDIATELY - don't wait for anything
    router.push("/");

    // Update user score optimistically (non-blocking, background sync)
    if (currentExercise) {
      updateUserScore(currentExercise.score);
    }

    // Update currentStageId and level in background (fire and forget)
    if (stageId && user?._id) {
      // Fire and forget - don't block navigation
      (async () => {
        try {
          const completedStage = await app.service("stages").get(stageId);
          let allStages = getCachedStages();

          if (!allStages) {
            // Cache miss - fetch from API
            const stagesResponse = await app.service("stages").find();
            allStages = Array.isArray(stagesResponse)
              ? stagesResponse
              : (stagesResponse as any).data || [];
          }

          // Get user's current stage order (their actual progress)
          const userCurrentStageOrder = await getUserMaxStageOrder(
            user.currentStageId
          );

          // Find the next stage by order after the completed stage
          const nextStage = allStages?.find(
            (stage: any) => stage.order === completedStage.order + 1
          );

          // Only update if nextStage exists AND is ahead of user's current progress
          // This prevents level from decreasing if user goes back to earlier stages
          if (nextStage && nextStage.order > userCurrentStageOrder) {
            const updatedUser = await app.service("users").patch(user._id, {
              currentStageId: nextStage._id,
            });

            // Update auth store with new user data
            setAuthenticated(updatedUser);
          }
        } catch (err) {
          console.error("Failed to update level:", err);
        }
      })();
    }
  }, [
    router,
    currentExercise,
    updateUserScore,
    stageId,
    user,
    setAuthenticated,
    exerciseOrder,
    apiExercises,
  ]);

  const progress = useMemo(
    () =>
      stageExercises.length > 0 ? exerciseOrder / stageExercises.length : 0,
    [exerciseOrder, stageExercises.length]
  );

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

      <View style={styles.content}>{renderExercise}</View>

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

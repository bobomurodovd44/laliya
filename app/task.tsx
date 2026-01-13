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
import { useTranslation } from "../lib/localization";
import { useAuthStore } from "../lib/store/auth-store";
import { uploadAudioMultipart } from "../lib/upload/multipart-upload";
import {
  checkStageAccess,
  getUserMaxStageOrder,
} from "../lib/utils/stage-access";

export default function Task() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
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
  const isExerciseActiveRef = useRef(false); // Track if user is actively working on exercises
  const previousUserCurrentStageIdRef = useRef<string | undefined | null>(null); // Track previous currentStageId to detect changes
  const wasExerciseActiveRef = useRef(false); // Track previous isExerciseActive state to detect returns
  const hasLoadedOnceRef = useRef(false); // Track if we've successfully loaded at least once

  useEffect(() => {
    // Reset state immediately before async operations to prevent stale state
    setIsCompleted(false);
    setError(null);
    // Reset completion ref to ensure button is not disabled
    isCompletingRef.current = false;
    // Clear any pending timeout
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    if (!stageId) {
      setError("Stage ID is required");
      setLoading(false);
      setCurrentExercise(null);
      isExerciseActiveRef.current = false;
      wasExerciseActiveRef.current = false;
      return;
    }

    // Always clear cache when entering a stage (exerciseOrder 1) to ensure fresh data
    if (exerciseOrder === 1) {
      // #region agent log
      const oldResetKey = resetKey;
      // #endregion
      clearExercisesCache(stageId);
      setCurrentExercise(null);
      setStageExercises([]);
      setApiExercises([]);
      setLoading(true);
      setResetKey((prev) => prev + 1);
      currentStageIdRef.current = null;
      recordedAudioUriRef.current = null;
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "task.tsx:reset-on-entry",
            message: "Stage entry reset",
            data: {
              stageId: stageId,
              exerciseOrder: exerciseOrder,
              oldResetKey: oldResetKey,
              newResetKey: oldResetKey + 1,
              isCompletedBefore: isCompleted,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H4",
          }),
        }
      ).catch(() => {});
      // #endregion
    }

    // Debug logging

    previousStageIdRef.current = stageId;

    // Mark that user is actively working on exercises
    // This should be set AFTER checking isReturningToStage
    if (stageId) {
      isExerciseActiveRef.current = true;
      // Don't set wasExerciseActiveRef here - it will be set after loading completes
      // This prevents the double-run issue where the second useEffect thinks we're already active
    }

    // Clear stage access cache when user's currentStageId changes from undefined to a value
    // BUT only if user is NOT actively working on exercises in this stage
    // This prevents clearing cache during active exercise sessions
    const currentUserStageId = user?.currentStageId;
    const previousUserStageId = previousUserCurrentStageIdRef.current;
    if (previousUserStageId !== currentUserStageId) {
      // If currentStageId changed (especially from undefined/null to a value), clear cache
      // This handles the case where backend sets currentStageId after user creation
      // BUT only if user is not actively working on exercises in this stage
      if (
        (!previousUserStageId && currentUserStageId) ||
        previousUserStageId !== currentUserStageId
      ) {
        // Only clear cache if user is NOT actively working on exercises in this stage
        // If they are actively working, keep the cache to prevent unnecessary re-validation
        if (!isExerciseActiveRef.current || !currentExercise) {
          // Clear all cache entries for this stage to force re-verification
          // We'll keep cache entries for other stages
          const keysToDelete: string[] = [];
          stageAccessCacheRef.current.forEach((value, key) => {
            if (key.startsWith(`${stageId}-`)) {
              keysToDelete.push(key);
            }
          });
          keysToDelete.forEach((key) =>
            stageAccessCacheRef.current.delete(key)
          );
        }
      }
      previousUserCurrentStageIdRef.current = currentUserStageId;
    }

    // For exerciseOrder 1 (entering stage), always fetch fresh (cache was cleared above)
    // For other orders (navigating within stage), use cache if available for performance
    const cached = exerciseOrder === 1 ? null : getCachedExercises(stageId);

    // Check stage access before loading exercises (cached per stageId)
    const verifyStageAccess = async () => {
      // If user is actively working on exercises, don't redirect them
      // This prevents interrupting their session due to temporary access check failures
      if (isExerciseActiveRef.current && currentExercise) {
        // User is actively working - trust cached access or allow them to continue
        const cacheKey = `${stageId}-${user?.currentStageId || "none"}`;
        const cachedAccess = stageAccessCacheRef.current.get(cacheKey);
        if (cachedAccess === true) {
          return true; // Already verified and accessible
        }
        // If no cache but user is active, allow them to continue (don't block)
        if (cachedAccess === undefined) {
          // Cache as accessible to prevent blocking active sessions
          stageAccessCacheRef.current.set(cacheKey, true);
          return true;
        }
      }

      // Check cache first - only verify if stageId or user's currentStageId changed
      const cacheKey = `${stageId}-${user?.currentStageId || "none"}`;
      const cachedAccess = stageAccessCacheRef.current.get(cacheKey);

      if (cachedAccess !== undefined) {
        if (!cachedAccess) {
          // If user is actively working, don't redirect - allow them to continue
          if (isExerciseActiveRef.current) {
            // Override cache to allow continuation
            stageAccessCacheRef.current.set(cacheKey, true);
            return true;
          }
          // Only redirect if user is not actively working on exercises
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

        // Defensive handling: Always allow access to stage 1 regardless of currentStageId status
        // This ensures new users can always start learning, even if currentStageId is undefined
        if (stage.order === 1) {
          // Always allow access to stage 1 for all users (new or existing)
          stageAccessCacheRef.current.set(cacheKey, true);
          return true;
        }

        const isAccessible = await checkStageAccess(
          stage,
          user?.currentStageId
        );

        // Cache the result
        stageAccessCacheRef.current.set(cacheKey, isAccessible);

        if (!isAccessible && !isExerciseActiveRef.current) {
          // Only redirect if user is not actively working on exercises
          setError(t("exercise.accessDenied"));
          setLoading(false);
          setCurrentExercise(null);
          // Redirect to home after a short delay
          setTimeout(() => {
            router.replace("/");
          }, 2000);
          return false;
        }
        // If user is active but check failed, allow them to continue
        if (!isAccessible && isExerciseActiveRef.current) {
          console.warn(
            "Stage access check failed but user is active - allowing continuation"
          );
          stageAccessCacheRef.current.set(cacheKey, true);
          return true;
        }
        return true;
      } catch (err: any) {
        // On error, don't block the user - allow them to continue
        // This prevents redirects due to network issues or temporary errors
        console.warn("Failed to verify stage access:", err);
        // Cache as accessible to prevent repeated checks
        stageAccessCacheRef.current.set(cacheKey, true);
        return true;
      }
    };

    const loadData = async () => {
      // Check if stageId changed from previous
      const stageIdChanged =
        previousStageIdRef.current && previousStageIdRef.current !== stageId;

      // Only verify stage access if stageId changed or we don't have cached access
      // This prevents unnecessary checks when navigating between exercises in the same stage
      const cacheKey = `${stageId}-${user?.currentStageId || "none"}`;
      const cachedAccess = stageAccessCacheRef.current.get(cacheKey);

      // If we have cached access and stageId hasn't changed, skip verification
      // This handles the case where we're navigating between exercises in the same stage
      // (only exerciseOrder changes, not stageId)
      if (cachedAccess === true && !stageIdChanged) {
        // Stage is accessible, proceed with loading exercises
        // No need to re-verify access when navigating between exercises in the same stage
      } else if (
        isExerciseActiveRef.current &&
        currentExercise &&
        !stageIdChanged
      ) {
        // User is actively working on exercises in this stage and stageId hasn't changed
        // Even if we don't have cached access, allow them to continue (they're already in the stage)
        // Cache as accessible to prevent future checks
        stageAccessCacheRef.current.set(cacheKey, true);
      } else {
        // Verify stage access (only if stageId changed or no cached access)
        const hasAccess = await verifyStageAccess();
        if (!hasAccess) {
          return;
        }
      }

      // If we have cached data (when navigating between exercises), use it
      if (cached && exerciseOrder > 1) {
        setStageExercises(cached.exercises);
        setApiExercises(cached.apiExercises);

        const exerciseIndex = exerciseOrder - 1;
        if (exerciseIndex >= 0 && exerciseIndex < cached.exercises.length) {
          const exercise = cached.exercises[exerciseIndex];
          setCurrentExercise(exercise);
          setIsLastExercise(exerciseOrder >= cached.exercises.length);
          isCompletingRef.current = false;
          previousExerciseOrderRef.current = exerciseOrder;
          currentStageIdRef.current = stageId;
          isExerciseActiveRef.current = true;

          const currentApiExercise = cached.apiExercises[exerciseIndex];
          if (currentApiExercise) {
            const { items: exerciseItems } =
              mapPopulatedExerciseToExercise(currentApiExercise);
            setItems(exerciseItems);
          }

          setLoading(false);
          return;
        }
      }

      // No cache or exerciseOrder 1 - fetch fresh from API
      setCurrentExercise(null);
      setLoading(true);

      const loadExercises = async () => {
        try {
          // Fetch exercises from API with context for debugging
          const apiExercises = await fetchExercisesByStageId(stageId, 'task-page');

          if (apiExercises.length === 0) {
            setError(t("exercise.noExercises"));
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
            setError(t("exercise.exerciseNotFound"));
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
          // Mark that user is actively working on exercises
          isExerciseActiveRef.current = true;
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

  // Set wasExerciseActiveRef after exercise loads successfully
  // This prevents the double-run issue in the main useEffect
  useEffect(() => {
    if (currentExercise && !loading) {
      wasExerciseActiveRef.current = true;
      hasLoadedOnceRef.current = true; // Mark that we've successfully loaded at least once
    }
  }, [currentExercise, loading]);

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

      // Always reset completion state when screen gains focus
      // This allows users to retry exercises when returning to them
      if (currentExercise) {
        setIsCompleted(false);
        isCompletingRef.current = false;
        if (completionTimeoutRef.current) {
          clearTimeout(completionTimeoutRef.current);
          completionTimeoutRef.current = null;
        }
      }

      // Update the ref when exercise changes
      previousExerciseOrderRef.current = exerciseOrder;

      // Return cleanup function that runs when screen loses focus
      return () => {
        // Mark that user is no longer actively working on exercises
        // This allows us to detect when they return to the stage
        ("[Task useFocusEffect cleanup] Setting wasExerciseActiveRef to false");
        wasExerciseActiveRef.current = false;
        isExerciseActiveRef.current = false;
      };
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

  // Helper function to create or update answer based on isCorrect
  const createOrUpdateAnswer = useCallback(
    async (exerciseId: string, isCorrect: boolean) => {
      if (!user?._id) return;

      try {
        const userId =
          typeof user._id === "string" ? user._id : String(user._id);

        // Check if answer already exists for this user and exercise
        const existingAnswers = await app.service("answers").find({
          query: {
            userId: userId,
            exerciseId: exerciseId,
            $limit: 1,
          },
        });

        const existingAnswer = Array.isArray(existingAnswers)
          ? existingAnswers[0]
          : existingAnswers.data?.[0];

        if (existingAnswer) {
          // Update existing answer with isCorrect field
          await app.service("answers").patch(existingAnswer._id, {
            isCorrect: isCorrect,
          });
        } else {
          // Create new answer with isCorrect field
          const newAnswer = await app.service("answers").create({
            userId: userId,
            exerciseId: exerciseId,
            isCorrect: isCorrect,
          });
        }
      } catch (err) {
        // Silent fail - don't block user experience
        console.error("Failed to create/update answer:", err);
      }
    },
    [user?._id]
  );

  const handleComplete = useCallback(
    async (isCorrect: boolean = true) => {
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "task.tsx:handleComplete-entry",
            message: "handleComplete called",
            data: {
              isCorrect: isCorrect,
              loading: loading,
              hasCurrentExercise: !!currentExercise,
              isCompletingRef: isCompletingRef.current,
              isCompleted: isCompleted,
              currentExerciseType: currentExercise?.type,
              stageId: stageId,
              exerciseOrder: exerciseOrder,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H4,H5",
          }),
        }
      ).catch(() => {});
      // #endregion

      // Only allow completion if not loading and exercise exists
      if (loading || !currentExercise || isCompletingRef.current) {
        return;
      }

      // Ensure active flag is set before any operations to prevent redirects
      isExerciseActiveRef.current = true;

      // Mark as completing immediately to prevent multiple calls
      isCompletingRef.current = true;

      // Clear any existing timeout
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      // Create or update answer for all exercise types (except LookAndSay which handles it separately)
      // This runs in background (fire and forget) for BOTH correct and incorrect answers
      // It does NOT block the UI - confetti or navigation will happen immediately
      if (
        currentExercise.type !== ExerciseType.LOOK_AND_SAY &&
        apiExercises.length > 0
      ) {
        const currentApiExercise = apiExercises[exerciseOrder - 1];
        if (currentApiExercise?._id) {
          const exerciseId =
            typeof currentApiExercise._id === "string"
              ? currentApiExercise._id
              : String(currentApiExercise._id);
          // Fire and forget - run in background, don't await, don't block
          (async () => {
            try {
              await createOrUpdateAnswer(exerciseId, isCorrect);
            } catch (err) {
              // Silent fail - don't block user experience
            }
          })();
        }
      }

      // Update score for all answers (score always increases)
      updateUserScore(currentExercise.score);

      // Enable button IMMEDIATELY for instant feedback - synchronous state update
      // This applies to both correct and incorrect answers
      setIsCompleted(true);

      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/1bc58072-684a-48c4-a65b-786846b4a9f2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "task.tsx:handleComplete-setCompleted",
            message: "setIsCompleted(true) called",
            data: {
              isCorrect: isCorrect,
              stageId: stageId,
              exerciseOrder: exerciseOrder,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H4",
          }),
        }
      ).catch(() => {});
      // #endregion

      // Start confetti immediately for all answers (both correct and incorrect)
      if (currentExercise.type !== ExerciseType.LOOK_AND_SAY && !loading) {
        confettiRef.current?.start();
      }

      // Note: Removed background stage access check after completion
      // This was causing unwanted redirects when users were actively working on exercises
      // Stage access is already verified on initial load, which is sufficient
    },
    [
      currentExercise,
      loading,
      stageId,
      user?.currentStageId,
      user?._id,
      router,
      updateUserScore,
      isLastExercise,
      exerciseOrder,
      stageExercises,
      apiExercises,
      setAuthenticated,
      createOrUpdateAnswer,
    ]
  );

  const renderExercise = useMemo(() => {
    if (!currentExercise) return null;

    // Don't render exercise if it's from a different stage (prevents flash of old content)
    // Compare with the ref to ensure we only render exercises for the current stageId
    if (currentStageIdRef.current !== stageId) return null;

    // Create a unique key to force remount on every stage entry
    // Include resetKey for all exercises to ensure fresh state
    const baseKey = `${currentExercise.stageId}-${currentExercise.order}`;
    const exerciseKey = `${baseKey}-${resetKey}`;

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
        const currentApiExercise = apiExercises[exerciseOrder - 1];
        return (
          <SortAndGroup
            key={exerciseKey}
            exercise={currentExercise}
            onComplete={handleComplete}
            apiExercise={currentApiExercise}
          />
        );
      default:
        return <Body style={styles.errorText}>Unknown exercise type</Body>;
    }
  }, [
    currentExercise,
    resetKey,
    handleComplete,
    stageId,
    apiExercises,
    exerciseOrder,
  ]);

  const handleNext = useCallback(() => {
    if (!isLastExercise && stageId && currentExercise) {
      // Ensure active flag is set before navigation to prevent redirects
      isExerciseActiveRef.current = true;

      // Calculate next order immediately
      const nextOrder = exerciseOrder + 1;
      const nextIndex = nextOrder - 1;

      // Navigate IMMEDIATELY for fastest transition - use requestAnimationFrame for instant UI response
      requestAnimationFrame(() => {
        router.push(`/task?stageId=${stageId}&exerciseOrder=${nextOrder}`);
      });

      // Defer all non-critical operations to after navigation completes
      InteractionManager.runAfterInteractions(() => {
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

              const mediaId = await uploadAudioMultipart(
                recordedAudioUriRef.current!,
                userId,
                exerciseId
              );

              // Save/update answer in answers service if audio upload succeeded
              if (mediaId) {
                try {
                  // Check if answer already exists for this user and exercise
                  const existingAnswers = await app.service("answers").find({
                    query: {
                      userId: userId,
                      exerciseId: exerciseId,
                      $limit: 1,
                    },
                  });

                  const existingAnswer = Array.isArray(existingAnswers)
                    ? existingAnswers[0]
                    : existingAnswers.data?.[0];

                  if (existingAnswer) {
                    // Update existing answer with new audioId
                    await app.service("answers").patch(existingAnswer._id, {
                      audioId: mediaId,
                    });
                  } else {
                    // Create new answer
                    await app.service("answers").create({
                      audioId: mediaId,
                      userId: userId,
                      exerciseId: exerciseId,
                    });
                  }
                } catch (answerErr) {
                  // Silent fail - don't block user experience
                }
              }

              // Clear recorded URI after upload
              recordedAudioUriRef.current = null;
            } catch (err) {
              // Silent fail - don't block user experience
            }
          })();
        }

        // Update state optimistically for instant display (deferred)
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
            isCompletingRef.current = false;
            // Clear recorded audio URI when moving to next exercise
            recordedAudioUriRef.current = null;
          }
        }
      });
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

  const handleSubmit = useCallback(() => {
    // Note: Answer creation is already handled in handleComplete() when user completes the exercise
    // No need to create it again here - it would be duplicate work

    // Navigate IMMEDIATELY using requestAnimationFrame for instant UI response
    requestAnimationFrame(() => {
      router.push("/");
    });

    // Defer all non-critical operations to after navigation completes
    InteractionManager.runAfterInteractions(() => {
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

            const mediaId = await uploadAudioMultipart(
              recordedAudioUriRef.current!,
              userId,
              exerciseId
            );

            // Save/update answer in answers service if audio upload succeeded
            if (mediaId) {
              try {
                // Check if answer already exists for this user and exercise
                const existingAnswers = await app.service("answers").find({
                  query: {
                    userId: userId,
                    exerciseId: exerciseId,
                    $limit: 1,
                  },
                });

                const existingAnswer = Array.isArray(existingAnswers)
                  ? existingAnswers[0]
                  : existingAnswers.data?.[0];

                if (existingAnswer) {
                  // Update existing answer with new audioId
                  await app.service("answers").patch(existingAnswer._id, {
                    audioId: mediaId,
                  });
                } else {
                  // Create new answer
                  await app.service("answers").create({
                    audioId: mediaId,
                    userId: userId,
                    exerciseId: exerciseId,
                  });
                }
              } catch (answerErr) {
                // Silent fail - don't block user experience
              }
            }

            // Clear recorded URI after upload
            recordedAudioUriRef.current = null;
          } catch (err) {
            // Silent fail - don't block user experience
          }
        })();
      }

      // Clear exercises cache for this stage to ensure fresh data on return
      // This prevents showing stale completed exercises when user comes back to this stage
      if (stageId) {
        clearExercisesCache(stageId);
      }

      // Update currentStageId and level in background (fire and forget)
      if (stageId && user?._id) {
        // Fire and forget - don't block navigation
        (async () => {
          try {
            const completedStage = await app.service("stages").get(stageId);
            
            // Use 'task' namespace for isolation from index page cache
            let allStages = getCachedStages('task');

            if (!allStages) {
              // Cache miss - fetch from API with high limit to get all stages
              const stagesResponse = await app.service("stages").find({
                query: {
                  $limit: 100, // Fetch all stages (default is 10)
                  $sort: { order: 1 }
                }
              });
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
              
              const patchResponse = await app.service("users").patch(user._id, {
                currentStageId: nextStage._id,
              });

              // Handle both array and single object responses
              const updatedUser = Array.isArray(patchResponse) 
                ? patchResponse[0] 
                : patchResponse;


              // Update auth store with new user data
              setAuthenticated(updatedUser);
            } else {
            }
          } catch (err) {
            console.error("❌ Failed to update level:", err);
          }
        })();
      }
    });
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
          <LoadingSpinner
            message={t("exercise.loadingExercises")}
            size="large"
          />
        </View>
      </PageContainer>
    );
  }

  if (error || !currentExercise) {
    return (
      <PageContainer>
        <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
          <Body style={styles.errorText}>
            {error || t("exercise.exerciseNotFound")}
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

      <View style={styles.content}>{renderExercise}</View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, Spacing.padding.lg) },
        ]}
      >
        {isLastExercise ? (
          <DuoButton
            title={t("common.submit")}
            onPress={handleSubmit}
            color="green"
            size="medium"
            disabled={!isCompleted}
          />
        ) : (
          <DuoButton
            title={t("common.next")}
            onPress={handleNext}
            color="green"
            size="medium"
            disabled={!isCompleted}
          />
        )}
      </View>

      <ConfettiCannon
        ref={confettiRef}
        count={40}
        origin={{ x: Dimensions.get("window").width / 2, y: -50 }}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={0}
        fallSpeed={3000}
        colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']}
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

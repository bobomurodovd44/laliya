import { Exercise } from "../../data/data";
import { PopulatedExercise } from "../api/exercises";

interface CachedExercises {
  exercises: Exercise[];
  apiExercises: PopulatedExercise[];
  timestamp: number;
}

// In-memory cache for exercises by stageId
const exercisesCache = new Map<string, CachedExercises>();

// Cache expiry time: 1 minute (test uchun)
const CACHE_EXPIRY = 60 * 1000;

/**
 * Gets cached exercises for a stage if they exist and are not expired
 * @param stageId - The stage ID to get cached exercises for
 * @returns Cached exercises or null if not found or expired
 */
export const getCachedExercises = (stageId: string): CachedExercises | null => {
  const cached = exercisesCache.get(stageId);
  if (!cached) return null;
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY) {
    exercisesCache.delete(stageId);
    return null;
  }
  
  return cached;
};

/**
 * Sets cached exercises for a stage
 * @param stageId - The stage ID to cache exercises for
 * @param exercises - Mapped exercises array
 * @param apiExercises - Original API exercises array
 */
export const setCachedExercises = (
  stageId: string,
  exercises: Exercise[],
  apiExercises: PopulatedExercise[]
): void => {
  exercisesCache.set(stageId, {
    exercises,
    apiExercises,
    timestamp: Date.now(),
  });
};

/**
 * Clears cached exercises for a specific stage or all stages
 * @param stageId - Optional stage ID to clear. If not provided, clears all cache
 */
export const clearExercisesCache = (stageId?: string): void => {
  if (stageId) {
    exercisesCache.delete(stageId);
  } else {
    exercisesCache.clear();
  }
};


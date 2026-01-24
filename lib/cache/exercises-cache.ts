import { Exercise } from "../../data/data";
import { PopulatedExercise } from "../api/exercises";

interface CachedExercises {
  exercises: Exercise[];
  apiExercises: PopulatedExercise[];
  total: number;
  timestamp: number;
  version: number;
}

// In-memory cache for exercises by stageId
const exercisesCache = new Map<string, CachedExercises>();

// Cache expiry time: 5 minutes (provides performance benefits during active sessions)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Cache version - increment this when data structure changes to invalidate old caches
const CACHE_VERSION = 2; // Incremented version due to structural change

/**
 * Gets cached exercises for a stage if they exist and are not expired
 * @param stageId - The stage ID to get cached exercises for
 * @returns Cached exercises or null if not found or expired
 */
export const getCachedExercises = (stageId: string): CachedExercises | null => {
  const cached = exercisesCache.get(stageId);
  if (!cached) return null;

  // Check if cache version is outdated
  if (cached.version !== CACHE_VERSION) {
    exercisesCache.delete(stageId);
    return null;
  }

  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY) {
    exercisesCache.delete(stageId);
    return null;
  }

  return cached;
};

/**
 * Sets or merges cached exercises for a stage
 * @param stageId - The stage ID to cache exercises for
 * @param exercises - Mapped exercises array
 * @param apiExercises - Original API exercises array
 * @param total - Total number of exercises in the stage
 */
export const setCachedExercises = (
  stageId: string,
  exercises: Exercise[],
  apiExercises: PopulatedExercise[],
  total?: number
): void => {
  const existing = exercisesCache.get(stageId);
  const now = Date.now();

  if (!existing || existing.version !== CACHE_VERSION || now - existing.timestamp > CACHE_EXPIRY) {
    // Fresh cache
    exercisesCache.set(stageId, {
      exercises: [...exercises],
      apiExercises: [...apiExercises],
      total: total || 0,
      timestamp: now,
      version: CACHE_VERSION,
    });
  } else {
    // Merge cache
    const mergedExercises = [...existing.exercises];
    const mergedApiExercises = [...existing.apiExercises];

    // Helper to merge or update arrays based on order
    exercises.forEach((newEx) => {
      const index = mergedExercises.findIndex((e) => e.order === newEx.order);
      if (index !== -1) {
        mergedExercises[index] = newEx;
      } else {
        mergedExercises.push(newEx);
      }
    });

    apiExercises.forEach((newApiEx) => {
      const index = mergedApiExercises.findIndex((e) => e.order === newApiEx.order);
      if (index !== -1) {
        mergedApiExercises[index] = newApiEx;
      } else {
        mergedApiExercises.push(newApiEx);
      }
    });

    // Keep sorted by order
    mergedExercises.sort((a, b) => a.order - b.order);
    mergedApiExercises.sort((a, b) => a.order - b.order);

    exercisesCache.set(stageId, {
      exercises: mergedExercises,
      apiExercises: mergedApiExercises,
      total: total !== undefined ? total : existing.total,
      timestamp: now,
      version: CACHE_VERSION,
    });
  }
};

/**
 * Checks if a specific exercise order is already cached for a stage
 * @param stageId - The stage ID
 * @param order - The exercise order to check
 * @returns boolean
 */
export const isExerciseCached = (stageId: string, order: number): boolean => {
  const cached = getCachedExercises(stageId);
  if (!cached) return false;
  return cached.exercises.some((e) => e.order === order);
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



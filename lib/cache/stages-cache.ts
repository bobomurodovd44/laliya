import { Stage } from "../api/stages";

interface CachedStages {
  stages: Stage[];
  timestamp: number;
}

// In-memory cache for stages with namespace isolation
// Each feature (index, task, analytics) has its own cache namespace
const cachesByNamespace = new Map<string, CachedStages>();

// Cache expiry time: 5 minutes (increased for better performance)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Gets cached stages for a specific namespace if they exist and are not expired
 * @param namespace - Cache namespace ('index', 'task', 'analytics', or 'default')
 * @returns Cached stages or null if not found or expired
 */
export const getCachedStages = (namespace: string = 'default'): Stage[] | null => {
  const cached = cachesByNamespace.get(namespace);
  if (!cached) return null;
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY) {
    cachesByNamespace.delete(namespace);
    return null;
  }
  
  return cached.stages;
};

/**
 * Sets cached stages for a specific namespace
 * @param stages - Stages array to cache
 * @param namespace - Cache namespace ('index', 'task', 'analytics', or 'default')
 */
export const setCachedStages = (stages: Stage[], namespace: string = 'default'): void => {
  cachesByNamespace.set(namespace, {
    stages,
    timestamp: Date.now(),
  });
};

/**
 * Clears cached stages for a specific namespace or all namespaces
 * @param namespace - Optional namespace to clear. If not provided, clears all caches
 */
export const clearStagesCache = (namespace?: string): void => {
  if (namespace) {
    cachesByNamespace.delete(namespace);
  } else {
    cachesByNamespace.clear();
  }
};



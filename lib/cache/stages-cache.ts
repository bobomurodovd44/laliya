import { Stage } from "../api/stages";

interface CachedStages {
  stages: Stage[];
  timestamp: number;
}

// In-memory cache for stages
let cachedStages: CachedStages | null = null;

// Cache expiry time: 1 minute (test uchun)
const CACHE_EXPIRY = 60 * 1000;

/**
 * Gets cached stages if they exist and are not expired
 * @returns Cached stages or null if not found or expired
 */
export const getCachedStages = (): Stage[] | null => {
  if (!cachedStages) return null;
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cachedStages.timestamp > CACHE_EXPIRY) {
    cachedStages = null;
    return null;
  }
  
  return cachedStages.stages;
};

/**
 * Sets cached stages
 * @param stages - Stages array to cache
 */
export const setCachedStages = (stages: Stage[]): void => {
  cachedStages = {
    stages,
    timestamp: Date.now(),
  };
};

/**
 * Clears cached stages
 */
export const clearStagesCache = (): void => {
  cachedStages = null;
};



interface AnalyticsData {
  correctPercentage: number;
  totalAnswers: number;
  availableStages: number;
}

interface StageAnalytics {
  stageId: string;
  stageOrder: number;
  totalExercises: number;
  completedExercises: number;
  correctAnswers: number;
  wrongAnswers: number;
  correctPercentage: number;
}

interface CachedAnalytics {
  analyticsData: AnalyticsData;
  stageAnalytics: StageAnalytics[];
  timestamp: number;
  version: number;
}

// In-memory cache for analytics by userId
const analyticsCache = new Map<string, CachedAnalytics>();

// Cache expiry time: 5 minutes (analytics don't change that frequently)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Cache version - increment this when data structure changes to invalidate old caches
const CACHE_VERSION = 1;

/**
 * Gets cached analytics for a user if they exist and are not expired
 * @param userId - The user ID to get cached analytics for
 * @returns Cached analytics or null if not found or expired
 */
export const getCachedAnalytics = (
  userId: string
): { analyticsData: AnalyticsData; stageAnalytics: StageAnalytics[] } | null => {
  const cached = analyticsCache.get(userId);
  if (!cached) return null;

  // Check if cache version is outdated
  if (cached.version !== CACHE_VERSION) {
    analyticsCache.delete(userId);
    return null;
  }

  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY) {
    analyticsCache.delete(userId);
    return null;
  }

  return {
    analyticsData: cached.analyticsData,
    stageAnalytics: cached.stageAnalytics,
  };
};

/**
 * Sets cached analytics for a user
 * @param userId - The user ID to cache analytics for
 * @param analyticsData - Analytics data to cache
 * @param stageAnalytics - Stage analytics to cache
 */
export const setCachedAnalytics = (
  userId: string,
  analyticsData: AnalyticsData,
  stageAnalytics: StageAnalytics[]
): void => {
  analyticsCache.set(userId, {
    analyticsData,
    stageAnalytics,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  });
};

/**
 * Clears cached analytics for a specific user or all users
 * @param userId - Optional user ID to clear. If not provided, clears all cache
 */
export const clearAnalyticsCache = (userId?: string): void => {
  if (userId) {
    analyticsCache.delete(userId);
  } else {
    analyticsCache.clear();
  }
};

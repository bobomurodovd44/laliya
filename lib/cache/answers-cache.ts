interface Answer {
  _id: string;
  audioId?: string;
  userId: string;
  exerciseId: string;
  mark?: number;
  createdAt: number;
  updatedAt: number;
  exercise?: {
    question: string;
    type: string;
    stageId?: string;
    options?: Array<{
      _id: string;
      word?: string;
      img?: {
        name: string;
        fileType: string;
        size: number;
      };
    }>;
  };
  audio?: {
    name: string;
    fileType: string;
    size: number;
  };
}

interface CachedAnswers {
  answers: Answer[];
  timestamp: number;
  version: number;
}

// In-memory cache for answers with namespace support (userId-stageId or userId-all)
const answersCache = new Map<string, CachedAnswers>();

// Cache expiry time: 2 minutes (balance between freshness and performance)
const CACHE_EXPIRY = 2 * 60 * 1000;

// Cache version - increment when data structure changes
const CACHE_VERSION = 1;

/**
 * Gets cached answers for a user and optional stage
 * @param userId - The user ID
 * @param stageId - Optional stage ID. If not provided, returns all user answers
 * @returns Cached answers or null if not found or expired
 */
export const getCachedAnswers = (userId: string, stageId?: string): Answer[] | null => {
  const cacheKey = stageId ? `${userId}-${stageId}` : `${userId}-all`;
  const cached = answersCache.get(cacheKey);
  if (!cached) return null;
  
  // Check version
  if (cached.version !== CACHE_VERSION) {
    answersCache.delete(cacheKey);
    return null;
  }
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY) {
    answersCache.delete(cacheKey);
    return null;
  }
  
  return cached.answers;
};

/**
 * Sets cached answers for a user and optional stage
 * @param userId - The user ID
 * @param answers - Answers array to cache
 * @param stageId - Optional stage ID. If not provided, caches all user answers
 */
export const setCachedAnswers = (
  userId: string,
  answers: Answer[],
  stageId?: string
): void => {
  const cacheKey = stageId ? `${userId}-${stageId}` : `${userId}-all`;
  answersCache.set(cacheKey, {
    answers,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  });
};

/**
 * Clears cached answers for a specific user/stage or all caches
 * @param userId - Optional user ID to clear
 * @param stageId - Optional stage ID to clear
 */
export const clearAnswersCache = (userId?: string, stageId?: string): void => {
  if (userId && stageId) {
    answersCache.delete(`${userId}-${stageId}`);
  } else if (userId) {
    // Clear all caches for this user
    const keysToDelete: string[] = [];
    answersCache.forEach((_, key) => {
      if (key.startsWith(`${userId}-`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => answersCache.delete(key));
  } else {
    answersCache.clear();
  }
};


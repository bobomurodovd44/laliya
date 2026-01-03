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
}

// In-memory cache for answers by stageId
const answersCache = new Map<string, CachedAnswers>();

// Cache expiry time: 1 minute (test uchun)
const CACHE_EXPIRY = 60 * 1000;

/**
 * Gets cached answers for a stage if they exist and are not expired
 * @param stageId - The stage ID to get cached answers for
 * @returns Cached answers or null if not found or expired
 */
export const getCachedAnswers = (stageId: string): Answer[] | null => {
  const cached = answersCache.get(stageId);
  if (!cached) return null;
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY) {
    answersCache.delete(stageId);
    return null;
  }
  
  return cached.answers;
};

/**
 * Sets cached answers for a stage
 * @param stageId - The stage ID to cache answers for
 * @param answers - Answers array to cache
 */
export const setCachedAnswers = (
  stageId: string,
  answers: Answer[]
): void => {
  answersCache.set(stageId, {
    answers,
    timestamp: Date.now(),
  });
};

/**
 * Clears cached answers for a specific stage or all stages
 * @param stageId - Optional stage ID to clear. If not provided, clears all cache
 */
export const clearAnswersCache = (stageId?: string): void => {
  if (stageId) {
    answersCache.delete(stageId);
  } else {
    answersCache.clear();
  }
};


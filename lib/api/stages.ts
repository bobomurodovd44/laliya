import app from "../feathers/feathers-client";

export interface Stage {
  _id: string;
  order: number;
  numberOfExercises?: number;
  updatedAt: number;
  createdAt: number;
}

export interface StagesResponse {
  total?: number;
  data: Stage[];
  limit?: number;
  skip?: number;
}

/**
 * Fetches all stages from the backend API
 * @param context - Optional context identifier for debugging and isolation
 * @returns Promise<Stage[]> Array of stages sorted by order
 * @throws Error if the API request fails
 */
export const fetchStages = async (context?: string): Promise<Stage[]> => {
  try {
    // Log context for debugging if provided
    if (context && __DEV__) {
      console.log(`[fetchStages] Context: ${context}`);
    }
    
    const response = await app.service("stages").find({
      query: {
        $limit: 1000,
        $sort: { order: 1 }
      }
    });
    
    // Handle both paginated and non-paginated responses
    const stagesData: Stage[] = Array.isArray(response) 
      ? response 
      : (response as StagesResponse).data || [];
    
    // Sort by order to ensure correct display order
    const sortedStages = [...stagesData].sort((a, b) => a.order - b.order);
    
    return sortedStages;
  } catch (error: any) {
    if (context && __DEV__) {
      console.error(`[fetchStages] Error in context ${context}:`, error);
    }
    throw new Error(error.message || "Failed to load stages");
  }
};


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
 * @returns Promise<Stage[]> Array of stages sorted by order
 * @throws Error if the API request fails
 */
export const fetchStages = async (): Promise<Stage[]> => {
  try {
    const response = await app.service("stages").find();
    
    // Handle both paginated and non-paginated responses
    const stagesData: Stage[] = Array.isArray(response) 
      ? response 
      : (response as StagesResponse).data || [];
    
    // Sort by order to ensure correct display order
    const sortedStages = [...stagesData].sort((a, b) => a.order - b.order);
    
    return sortedStages;
  } catch (error: any) {
    console.error("Error fetching stages:", error);
    throw new Error(error.message || "Failed to load stages");
  }
};


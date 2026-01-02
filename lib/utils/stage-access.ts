import { Stage } from "../api/stages";
import app from "../feathers/feathers-client";

/**
 * Gets the maximum allowed stage order for a user based on their currentStageId
 * @param currentStageId - The user's currentStageId (ObjectId string)
 * @returns Promise<number> The maximum allowed stage order, or 0 if no currentStageId
 */
export const getUserMaxStageOrder = async (
  currentStageId?: string
): Promise<number> => {
  if (!currentStageId) {
    // If user has no currentStageId, default to order 0 (first stage only)
    return 0;
  }

  try {
    const currentStage = await app.service("stages").get(currentStageId);
    return currentStage.order;
  } catch (error) {
    // If stage doesn't exist or fetch fails, default to order 0
    return 0;
  }
};

/**
 * Checks if a stage is accessible to the user
 * @param stage - The stage to check
 * @param maxOrder - The maximum allowed stage order for the user
 * @returns boolean - True if stage is accessible (order <= maxOrder)
 */
export const isStageAccessible = (
  stage: Stage,
  maxOrder: number
): boolean => {
  return stage.order <= maxOrder;
};

/**
 * Gets the user's current stage order and checks if a stage is accessible
 * @param stage - The stage to check
 * @param currentStageId - The user's currentStageId (ObjectId string)
 * @returns Promise<boolean> - True if stage is accessible
 */
export const checkStageAccess = async (
  stage: Stage,
  currentStageId?: string
): Promise<boolean> => {
  const maxOrder = await getUserMaxStageOrder(currentStageId);
  return isStageAccessible(stage, maxOrder);
};


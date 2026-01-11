import app from "../feathers/feathers-client";

/**
 * Check if user has childMeta by fetching fresh data from backend
 * @param userId - The user's ID
 * @returns true if user has complete childMeta, false otherwise
 */
export async function checkUserHasChildMeta(userId: string): Promise<boolean> {
  try {
    // Fetch fresh user data from backend
    const user = await app.service("users").get(userId);
    
    // Check if childMeta exists and has all required fields
    const hasChildMeta =
      user?.childMeta &&
      user.childMeta.fullName &&
      user.childMeta.age &&
      user.childMeta.gender;

    return !!hasChildMeta;
  } catch (error) {
    console.error("Failed to check childMeta:", error);
    return false;
  }
}

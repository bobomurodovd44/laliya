import app from "../feathers/feathers-client";

export interface FeathersAuthUserData {
  fullName: string;
  role: "user" | "admin";
  childMeta?: {
    fullName: string;
    age: number;
    gender: "male" | "female";
  };
}

export interface FeathersAuthResult {
  user: any;
  accessToken: string;
}

/**
 * Authenticate with Feathers using Firebase token
 */
export async function authenticateWithFeathers(
  accessToken: string,
  userData: FeathersAuthUserData
): Promise<FeathersAuthResult> {
  try {
    const result = await app.authenticate({
      strategy: "firebase",
      accessToken,
      userData,
    });

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  } catch (error: any) {
    // Handle authentication errors
    const errorMessage =
      error?.message || "Authentication failed. Please try again.";
    throw new Error(errorMessage);
  }
}


import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase/config";

// Web Client ID from google-services.json (client_type: 3)
const WEB_CLIENT_ID =
  "307432035320-rshm5utmm57va64ouqfht6s5cmkgt0ut.apps.googleusercontent.com";

export interface GoogleSignInResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    photo: string | null;
  };
  accessToken: string; // Firebase access token for Feathers authentication
}

export interface GoogleSignInError {
  code: string;
  message: string;
}

/**
 * Configure Google Sign-In
 * Should be called once when app starts
 */
export function configureGoogleSignIn(): void {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });
}

/**
 * Get user-friendly error message from Google Sign-In error
 */
function getGoogleSignInErrorMessage(error: any): string {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return "Sign in was cancelled";
      case statusCodes.IN_PROGRESS:
        return "Sign in is already in progress";
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return "Google Play Services not available or outdated";
      default:
        return error.message || "Google Sign-In failed";
    }
  }
  return error?.message || "Google Sign-In failed. Please try again.";
}

/**
 * Sign in with Google
 * Returns user info and Firebase access token for Feathers authentication
 * Always shows account picker by signing out first if there's a previous sign-in
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    // Check if Google Play Services are available (Android only)
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Sign out first to clear cached account and force account picker
    // This ensures users can choose a different account each time
    try {
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch (signOutError) {
      // Ignore sign out errors - continue with sign in even if sign out fails
    }

    // Sign in with Google - this will now show the account picker

    const response = await GoogleSignin.signIn();

    // Handle response - check if it has type property (newer API) or direct idToken/user (older API)
    let idToken: string;
    let userData: any;

    if ("type" in response) {
      // Newer API with type property
      if (response.type === "cancelled") {
        throw {
          code: statusCodes.SIGN_IN_CANCELLED,
          message: "Sign in was cancelled",
        };
      }

      if (response.type === "noSavedCredentialFound") {
        throw {
          code: "NO_SAVED_CREDENTIAL",
          message: "No saved credential found. Please try signing in again.",
        };
      }

      if (response.type !== "success") {
        throw {
          code: "UNKNOWN_RESPONSE_TYPE",
          message: `Google Sign-In failed with response type: ${response.type}`,
        };
      }

      // Type assertion for success response with data property
      const successResponse = response as unknown as {
        type: "success";
        data: { user: any };
      };

      // Extract data from successful response with type
      if (!successResponse.data || !successResponse.data.user) {
        throw {
          code: "INVALID_RESPONSE",
          message: "Invalid response from Google Sign-In",
        };
      }

      // Get ID token from tokens
      const tokens = await GoogleSignin.getTokens();
      if (!tokens || !tokens.idToken) {
        throw {
          code: "NO_ID_TOKEN",
          message: "Failed to get ID token from Google Sign-In",
        };
      }

      idToken = tokens.idToken;
      userData = successResponse.data.user;
    } else {
      // Older API - response directly contains idToken and user
      if (!response.idToken || !response.user) {
        throw {
          code: "INVALID_RESPONSE",
          message:
            "Invalid response from Google Sign-In - missing idToken or user",
        };
      }

      idToken = response.idToken;
      userData = response.user;
    }

    // Create Firebase credential from Google ID token
    const googleCredential = GoogleAuthProvider.credential(idToken);

    if (!googleCredential) {
      throw {
        code: "CREDENTIAL_CREATION_FAILED",
        message: "Failed to create Firebase credential",
      };
    }

    // Sign in to Firebase with Google credential
    const firebaseUserCredential = await signInWithCredential(
      auth,
      googleCredential
    );

    // Get Firebase access token for Feathers authentication
    const accessToken = await firebaseUserCredential.user.getIdToken();

    return {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name || null,
        photo: userData.photo || null,
      },
      accessToken,
    };
  } catch (error: any) {
    console.error("Google Sign-In error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    // If error already has code and message, use it
    if (error.code && error.message) {
      throw {
        code: error.code,
        message: error.message,
      } as GoogleSignInError;
    }

    // Otherwise, get user-friendly error message
    const errorMessage = getGoogleSignInErrorMessage(error);
    throw {
      code: error?.code || "GOOGLE_SIGNIN_ERROR",
      message: errorMessage,
    } as GoogleSignInError;
  }
}

/**
 * Check if user has previously signed in with Google
 */
export function hasPreviousGoogleSignIn(): boolean {
  return GoogleSignin.hasPreviousSignIn();
}

/**
 * Sign out from Google
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error("Google Sign-Out error:", error);
    // Don't throw - allow sign out to continue even if Google sign out fails
  }
}

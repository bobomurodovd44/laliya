import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import i18n from "../localization/i18n";
import { auth } from "../firebase/config";

const WEB_CLIENT_ID =
  "307432035320-rshm5utmm57va64ouqfht6s5cmkgt0ut.apps.googleusercontent.com";

export interface GoogleSignInResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    photo: string | null;
  };
  accessToken: string;
}

export interface GoogleSignInError {
  code: string;
  message: string;
  translationKey: string;
  title: string;
}

const GOOGLE_ERROR_MAP: Record<number | string, string> = {
  [statusCodes.SIGN_IN_CANCELLED]: "googleErrors.sign-in-cancelled",
  [statusCodes.IN_PROGRESS]: "googleErrors.in-progress",
  [statusCodes.PLAY_SERVICES_NOT_AVAILABLE]: "googleErrors.play-services-not-available",
  "NO_SAVED_CREDENTIAL": "googleErrors.no-saved-credential",
  "INVALID_RESPONSE": "googleErrors.invalid-response",
  "NO_ID_TOKEN": "googleErrors.no-id-token",
  "CREDENTIAL_CREATION_FAILED": "googleErrors.credential-creation-failed",
};

function getGoogleErrorTranslationKey(errorCode: string | number): string {
  return GOOGLE_ERROR_MAP[errorCode] || "googleErrors.google-signin-failed";
}

function getGoogleErrorTitle(): string {
  return i18n.t("googleErrors.google-signin-failed-title");
}

/**
 * Get localized Google Sign-In error message
 */
export function getGoogleErrorMessage(errorCode: string | number): { message: string; translationKey: string; title: string } {
  const translationKey = getGoogleErrorTranslationKey(errorCode);
  const message = i18n.t(translationKey);
  const title = getGoogleErrorTitle();

  return { message, translationKey, title };
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
 * Sign in with Google
 * Returns user info and Firebase access token for Feathers authentication
 * Always shows account picker by signing out first if there's a previous sign-in
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    try {
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch (signOutError) {
    }

    const response = await GoogleSignin.signIn();

    let idToken: string;
    let userData: any;

    if ("type" in response) {
      if (response.type === "cancelled") {
        const { message, translationKey, title } = getGoogleErrorMessage(statusCodes.SIGN_IN_CANCELLED);
        throw {
          code: statusCodes.SIGN_IN_CANCELLED,
          message,
          translationKey,
          title,
        };
      }

      if (response.type === "noSavedCredentialFound") {
        const { message, translationKey, title } = getGoogleErrorMessage("NO_SAVED_CREDENTIAL");
        throw {
          code: "NO_SAVED_CREDENTIAL",
          message,
          translationKey,
          title,
        };
      }

      if (response.type !== "success") {
        const { message, translationKey, title } = getGoogleErrorMessage("INVALID_RESPONSE");
        throw {
          code: "UNKNOWN_RESPONSE_TYPE",
          message: `${message} (${response.type})`,
          translationKey,
          title,
        };
      }

      const successResponse = response as unknown as {
        type: "success";
        data: { user: any };
      };

      if (!successResponse.data || !successResponse.data.user) {
        const { message, translationKey, title } = getGoogleErrorMessage("INVALID_RESPONSE");
        throw {
          code: "INVALID_RESPONSE",
          message,
          translationKey,
          title,
        };
      }

      const tokens = await GoogleSignin.getTokens();
      if (!tokens || !tokens.idToken) {
        const { message, translationKey, title } = getGoogleErrorMessage("NO_ID_TOKEN");
        throw {
          code: "NO_ID_TOKEN",
          message,
          translationKey,
          title,
        };
      }

      idToken = tokens.idToken;
      userData = successResponse.data.user;
    } else {
      if (!response.idToken || !response.user) {
        const { message, translationKey, title } = getGoogleErrorMessage("INVALID_RESPONSE");
        throw {
          code: "INVALID_RESPONSE",
          message,
          translationKey,
          title,
        };
      }

      idToken = response.idToken;
      userData = response.user;
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);

    if (!googleCredential) {
      const { message, translationKey, title } = getGoogleErrorMessage("CREDENTIAL_CREATION_FAILED");
      throw {
        code: "CREDENTIAL_CREATION_FAILED",
        message,
        translationKey,
        title,
      };
    }

    const firebaseUserCredential = await signInWithCredential(
      auth,
      googleCredential
    );

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
    if (error.code && error.message && error.translationKey && error.title) {
      throw error;
    }

    if (isErrorWithCode(error)) {
      const { message, translationKey, title } = getGoogleErrorMessage(error.code);
      throw {
        code: error.code,
        message,
        translationKey,
        title,
      } as GoogleSignInError;
    }

    const { message, translationKey, title } = getGoogleErrorMessage("GOOGLE_SIGNIN_ERROR");
    throw {
      code: error?.code || "GOOGLE_SIGNIN_ERROR",
      message: error?.message || message,
      translationKey,
      title,
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
  }
}


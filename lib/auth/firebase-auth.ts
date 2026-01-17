import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  AuthError,
} from "firebase/auth";
import i18n from "../localization/i18n";
import { auth } from "../firebase/config";

export interface FirebaseAuthResult {
  user: User;
  accessToken: string;
}

export interface FirebaseAuthError {
  code: string;
  message: string;
  translationKey: string;
}

const FIREBASE_ERROR_MAP: Record<string, string> = {
  "auth/user-not-found": "firebaseErrors.user-not-found",
  "auth/wrong-password": "firebaseErrors.wrong-password",
  "auth/email-already-in-use": "firebaseErrors.email-already-in-use",
  "auth/weak-password": "firebaseErrors.weak-password",
  "auth/invalid-email": "firebaseErrors.invalid-email",
  "auth/user-disabled": "firebaseErrors.user-disabled",
  "auth/too-many-requests": "firebaseErrors.too-many-requests",
  "auth/network-request-failed": "firebaseErrors.network-request-failed",
};

function getFirebaseErrorTranslationKey(errorCode: string): string {
  return FIREBASE_ERROR_MAP[errorCode] || "firebaseErrors.auth-failed";
}

function getFirebaseErrorTitle(): string {
  return i18n.t("firebaseErrors.auth-failed-title");
}

/**
 * Get localized Firebase auth error message
 */
export function getFirebaseErrorMessage(error: AuthError): { message: string; translationKey: string; title: string } {
  const translationKey = getFirebaseErrorTranslationKey(error.code);
  const message = i18n.t(translationKey);
  const title = getFirebaseErrorTitle();

  return { message, translationKey, title };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<FirebaseAuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const accessToken = await user.getIdToken();

    return {
      user,
      accessToken,
    };
  } catch (error) {
    const authError = error as AuthError;
    const { message, translationKey, title } = getFirebaseErrorMessage(authError);
    throw {
      code: authError.code,
      message,
      translationKey,
      title,
    } as FirebaseAuthError;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<FirebaseAuthResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const accessToken = await user.getIdToken();

    return {
      user,
      accessToken,
    };
  } catch (error) {
    const authError = error as AuthError;
    const { message, translationKey, title } = getFirebaseErrorMessage(authError);
    throw {
      code: authError.code,
      message,
      translationKey,
      title,
    } as FirebaseAuthError;
  }
}


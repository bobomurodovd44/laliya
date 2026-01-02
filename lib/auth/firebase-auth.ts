import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  AuthError,
} from "firebase/auth";
import { auth } from "../firebase/config";

export interface FirebaseAuthResult {
  user: User;
  accessToken: string;
}

export interface FirebaseAuthError {
  code: string;
  message: string;
}

/**
 * Map Firebase auth error codes to user-friendly messages
 */
export function getFirebaseErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/email-already-in-use":
      return "Email already registered";
    case "auth/weak-password":
      return "Password is too weak (minimum 6 characters)";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/user-disabled":
      return "This account has been disabled";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Please check your connection";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
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
    throw {
      code: authError.code,
      message: getFirebaseErrorMessage(authError),
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
    throw {
      code: authError.code,
      message: getFirebaseErrorMessage(authError),
    } as FirebaseAuthError;
  }
}

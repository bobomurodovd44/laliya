import app from "../feathers/feathers-client";
import i18n from "../localization/i18n";

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

export interface FeathersAuthError {
  message: string;
  code: string;
  translationKey: string;
  title: string;
}

const BACKEND_ERROR_MAP: Record<string, string> = {
  "EMAIL_REQUIRED": "backendErrors.email-required",
  "ROLE_MISMATCH": "backendErrors.role-mismatch",
  "AUTHENTICATION_FAILED": "backendErrors.authentication-failed",
  "INVALID_TOKEN": "backendErrors.invalid-token",
  "TOKEN_VERIFICATION_FAILED": "backendErrors.token-verification-failed",
  "USER_CREATION_FAILED": "backendErrors.user-creation-failed",
  "USER_NOT_FOUND": "backendErrors.user-not-found",
  "SERVER_ERROR": "backendErrors.server-error",
};

function getBackendErrorTranslationKey(errorCode: string): string {
  return BACKEND_ERROR_MAP[errorCode] || "backendErrors.authentication-failed";
}

function getBackendErrorTitle(): string {
  return i18n.t("backendErrors.authentication-error-title");
}

/**
 * Get localized backend error message
 */
export function getBackendErrorMessage(errorCode: string, fallbackMessage?: string): { message: string; translationKey: string; title: string } {
  const translationKey = getBackendErrorTranslationKey(errorCode);
  const message = fallbackMessage || i18n.t(translationKey);
  const title = getBackendErrorTitle();

  return { message, translationKey, title };
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
    let errorCode = "AUTHENTICATION_FAILED";
    let errorMessage = error?.message || "";

    if (errorMessage.includes("credentials") && errorMessage.includes("different role")) {
      errorCode = "ROLE_MISMATCH";
    } else if (errorMessage.includes("Email is required")) {
      errorCode = "EMAIL_REQUIRED";
    } else if (errorMessage.includes("Invalid Firebase token") || errorMessage.includes("Invalid token")) {
      errorCode = "INVALID_TOKEN";
    } else if (errorMessage.includes("verify") || errorMessage.includes("verification")) {
      errorCode = "TOKEN_VERIFICATION_FAILED";
    } else if (errorMessage.includes("create") || errorMessage.includes("creation")) {
      errorCode = "USER_CREATION_FAILED";
    } else if (errorMessage.includes("User not found")) {
      errorCode = "USER_NOT_FOUND";
    } else if (errorMessage.includes("server") || errorMessage.includes("Server")) {
      errorCode = "SERVER_ERROR";
    }

    const { message, translationKey, title } = getBackendErrorMessage(errorCode, errorMessage);

    throw {
      message,
      code: errorCode,
      translationKey,
      title,
    } as FeathersAuthError;
  }
}


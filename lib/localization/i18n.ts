import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en/common.json";
import uzTranslations from "./locales/uz/common.json";

// Language detection: Try device locale, fallback to Uzbek
const getDefaultLanguage = (): "en" | "uz" => {
  try {
    // Get locales array from expo-localization
    const locales = Localization.getLocales();

    if (!locales || locales.length === 0) {
      // No locale available, default to Uzbek
      return "uz";
    }

    // Get the first locale's language code
    const firstLocale = locales[0];
    const languageCode = firstLocale.languageCode?.toLowerCase();

    if (!languageCode || typeof languageCode !== "string") {
      // Invalid locale, default to Uzbek
      return "uz";
    }

    // If device language is Uzbek, use it; otherwise default to Uzbek (as per requirement)
    // English is available but Uzbek is the primary language
    if (languageCode === "uz") {
      return "uz";
    }

    // Default to Uzbek (can be changed to 'en' if needed)
    return "uz";
  } catch (error) {
    // On any error, default to Uzbek
    console.warn(
      "Failed to detect device language, defaulting to Uzbek:",
      error
    );
    return "uz";
  }
};

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4", // For React Native compatibility
  resources: {
    en: {
      common: enTranslations,
    },
    uz: {
      common: uzTranslations,
    },
  },
  lng: getDefaultLanguage(), // Default language (Uzbek)
  fallbackLng: "uz", // Fallback to Uzbek if translation is missing
  defaultNS: "common",

  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // React Native specific settings
  react: {
    useSuspense: false, // Disable suspense mode for React Native
  },

  // Debug mode disabled to prevent console logs
  debug: false,
});

export default i18n;

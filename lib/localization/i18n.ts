import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import enTranslations from './locales/en/common.json';
import uzTranslations from './locales/uz/common.json';

// Language detection: Try device locale, fallback to Uzbek
const getDefaultLanguage = (): 'en' | 'uz' => {
  try {
    // Localization.locale can be a string, array, or undefined
    const deviceLocale = Localization.locale;
    
    if (!deviceLocale) {
      // No locale available, default to Uzbek
      return 'uz';
    }
    
    // Handle array case (Expo can return an array of locales)
    const localeString = Array.isArray(deviceLocale) 
      ? deviceLocale[0] 
      : deviceLocale;
    
    if (!localeString || typeof localeString !== 'string') {
      // Invalid locale, default to Uzbek
      return 'uz';
    }
    
    const languageCode = localeString.split('-')[0].toLowerCase();
    
    // If device language is Uzbek, use it; otherwise default to Uzbek (as per requirement)
    // English is available but Uzbek is the primary language
    if (languageCode === 'uz') {
      return 'uz';
    }
    
    // Default to Uzbek (can be changed to 'en' if needed)
    return 'uz';
  } catch (error) {
    // On any error, default to Uzbek
    console.warn('Failed to detect device language, defaulting to Uzbek:', error);
    return 'uz';
  }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // For React Native compatibility
    resources: {
      en: {
        common: enTranslations,
      },
      uz: {
        common: uzTranslations,
      },
    },
    lng: getDefaultLanguage(), // Default language (Uzbek)
    fallbackLng: 'uz', // Fallback to Uzbek if translation is missing
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React Native specific settings
    react: {
      useSuspense: false, // Disable suspense mode for React Native
    },
    
    // Debug mode (set to false in production)
    debug: __DEV__,
  });

export default i18n;


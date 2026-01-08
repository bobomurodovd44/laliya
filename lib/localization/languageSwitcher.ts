import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';

const LANGUAGE_STORAGE_KEY = '@laliya:language';

export type SupportedLanguage = 'en' | 'uz';

/**
 * Changes the app language and persists the preference
 * @param lang - Language code ('en' or 'uz')
 */
export const changeLanguage = async (lang: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
};

/**
 * Gets the saved language preference from storage
 * @returns Promise with the saved language or null if not found
 */
export const getSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage as SupportedLanguage | null;
  } catch (error) {
    console.error('Failed to get saved language:', error);
    return null;
  }
};

/**
 * Initializes language from saved preference or device locale
 * Should be called during app initialization
 */
export const initializeLanguage = async (): Promise<void> => {
  try {
    // Try to load saved language preference
    const savedLanguage = await getSavedLanguage();
    
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'uz')) {
      await i18n.changeLanguage(savedLanguage);
      return;
    }
    
    // If no saved preference, default to Uzbek
    await i18n.changeLanguage('uz');
  } catch (error) {
    console.error('Failed to initialize language:', error);
    // Fallback to Uzbek on error
    await i18n.changeLanguage('uz');
  }
};

/**
 * Gets the current active language
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};



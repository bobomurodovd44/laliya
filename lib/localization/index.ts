// Main i18n instance
export { default as i18n } from './i18n';

// Language switcher utilities
export {
  changeLanguage,
  getSavedLanguage,
  initializeLanguage,
  getCurrentLanguage,
  type SupportedLanguage,
} from './languageSwitcher';

// Translation hook
export { useTranslation } from 'react-i18next';



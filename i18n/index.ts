import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/index';
import sv from './locales/sv/index';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sv: { translation: sv },
  },
  lng: 'sv',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export { i18n };

export function setLocale(language: string) {
  const locale = language === 'Swedish' ? 'sv' : 'en';
  if (i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }
}

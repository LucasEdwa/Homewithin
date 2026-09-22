import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/index';
import sv from './locales/sv/index';
import ar from './locales/ar/index';

// `.use()` is a real instance method on the i18next singleton, not the package's named `use` export.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sv: { translation: sv },
    // Arabic has draft coverage only (common/home/onboarding) — see
    // locales/ar/index.ts. Everything else falls back to English via
    // fallbackLng below, so this is safe to ship as a work in progress.
    ar: { translation: ar },
  },
  lng: 'sv',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export { i18n };

// NOTE: RTL layout (mirrored screens, icon/nav direction) is not wired up —
// selecting Arabic gets correct right-to-left text rendering (handled
// automatically by the OS text layer) but the surrounding UI still flows
// left-to-right. Full RTL mirroring via I18nManager is a separate, larger
// change (it also requires a JS reload to take effect).
export function setLocale(language: string) {
  const locale = language === 'Swedish' ? 'sv' : language === 'Arabic' ? 'ar' : 'en';
  if (i18n.language !== locale) {
    // eslint-disable-next-line import/no-named-as-default-member -- real instance method, see note above.
    i18n.changeLanguage(locale);
  }
}

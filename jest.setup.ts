import { i18n } from '@/i18n';

// Tests always run in English so text assertions match en translations.
i18n.changeLanguage('en');

// Suppress the React Native SafeAreaView deprecation warning.
// Our screens use react-native's SafeAreaView which logs this in the test renderer.
// It's harmless — the production build uses the native implementation correctly.
const originalWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('SafeAreaView has been deprecated')) return;
  originalWarn(...args);
};

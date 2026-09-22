import { i18n, setLocale } from '@/i18n';

afterEach(async () => {
  // jest.setup.ts sets English as the baseline for every test file's text
  // assertions — restore it so this file doesn't leak a different language.
  await i18n.changeLanguage('en');
});

describe('Arabic locale (draft coverage)', () => {
  it('resolves translated keys from the drafted modules', async () => {
    await i18n.changeLanguage('ar');
    expect(i18n.t('common.cancel')).toBe('إلغاء');
    expect(i18n.t('tabs.home')).toBe('الرئيسية');
    expect(i18n.t('onboarding.intro.skip')).toBe('تخطي');
  });

  it('falls back to English for modules not yet translated', async () => {
    await i18n.changeLanguage('ar');
    // Safety-critical copy must never silently render in unreviewed Arabic —
    // it should fall back to English rather than show a raw i18n key.
    expect(i18n.t('aiCompanion.title')).toBe('AI Companion');
    expect(i18n.t('safetyAssessment.redTitle')).not.toMatch(/^safetyAssessment\./);
  });
});

describe('setLocale', () => {
  it('maps profile language names to the right i18next locale', () => {
    setLocale('Swedish');
    expect(i18n.language).toBe('sv');
    setLocale('Arabic');
    expect(i18n.language).toBe('ar');
    setLocale('English');
    expect(i18n.language).toBe('en');
    setLocale('Portuguese'); // no dedicated locale yet — falls back to English
    expect(i18n.language).toBe('en');
  });
});

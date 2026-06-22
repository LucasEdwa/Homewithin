import { ProfileBookmarksCard } from '@/components/profile/ProfileBookmarksCard';
import { ProfileDangerZone, ProfilePrivacyNote } from '@/components/profile/ProfileDangerZone';
import { ProfileDataCard } from '@/components/profile/ProfileDataCard';
import { ProfileIdentityCard } from '@/components/profile/ProfileIdentityCard';
import { ProfilePrivacyCard } from '@/components/profile/ProfilePrivacyCard';
import { SettingRow } from '@/components/profile/SettingRow';
import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { setLocale } from '@/i18n';
import { syncProfile } from '@/services/social/matching';
import { getBookmarkedResources } from '@/services/content/resources';
import type { Resource } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = ['Swedish', 'English'] as const;
type AppLanguage = typeof LANGUAGE_OPTIONS[number];

const LANGUAGE_DISPLAY: Record<AppLanguage, string> = {
  Swedish: 'Svenska',
  English: 'English',
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { profile, setProfile } = useSession();
  const [bookmarks, setBookmarks] = useState<Resource[]>([]);

  useFocusEffect(
    useCallback(() => {
      getBookmarkedResources().then(setBookmarks);
    }, [])
  );

  const currentLanguage: AppLanguage =
    (profile?.language as AppLanguage) === 'English' ? 'English' : 'Swedish';

  function handleLanguagePress() {
    const options = [...LANGUAGE_OPTIONS, t('common.cancel')];
    const cancelIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: t('profile.settings.selectLanguage') },
        (idx) => {
          if (idx === cancelIndex) return;
          applyLanguage(LANGUAGE_OPTIONS[idx]);
        },
      );
    } else {
      Alert.alert(
        t('profile.settings.selectLanguage'),
        undefined,
        [
          ...LANGUAGE_OPTIONS.map((lang) => ({
            text: LANGUAGE_DISPLAY[lang],
            onPress: () => applyLanguage(lang),
          })),
          { text: t('common.cancel'), style: 'cancel' as const },
        ],
      );
    }
  }

  async function applyLanguage(lang: AppLanguage) {
    setLocale(lang);
    if (!profile) return;
    const updated = { ...profile, language: lang };
    await setProfile(updated);
    await syncProfile(updated).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <ProfileIdentityCard />
        <ProfilePrivacyCard />
        <SettingRow
          label={t('profile.settings.openTo')}
          value=""
          onPress={() => router.push('/intentions')}
        />
        <SettingRow
          label={t('profile.settings.language')}
          value={LANGUAGE_DISPLAY[currentLanguage]}
          onPress={handleLanguagePress}
        />
        <ProfileDataCard />
        <ProfileBookmarksCard bookmarks={bookmarks} />
        <ProfileDangerZone />
        <ProfilePrivacyNote />
        <SettingRow
          label={t('profile.settings.termsOfUse')}
          value=""
          onPress={() => router.push('/terms')}
        />
        <SettingRow
          label={t('profile.settings.privacyPolicy')}
          value=""
          onPress={() => router.push('/privacy')}
        />
        <SettingRow
          label={t('profile.settings.reportConcern')}
          value=""
          onPress={() => Linking.openURL('mailto:lucas.eduardo2070@gmail.com?subject=HomeWithin%20Report')}
        />
      </ScrollView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
});

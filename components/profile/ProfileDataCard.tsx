import { Card } from '@/components/ui/Card';
import { SettingRow } from '@/components/profile/SettingRow';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { getCheckIns, getJournalEntries } from '@/services/storage';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Share, StyleSheet, Text } from 'react-native';

export function ProfileDataCard() {
  const { t } = useTranslation();
  const { profile } = useSession();
  const [exporting, setExporting] = useState(false);

  async function handleExportData() {
    if (exporting) return;
    setExporting(true);
    try {
      const [checkIns, journalEntries] = await Promise.all([getCheckIns(), getJournalEntries()]);
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: {
          nickname: profile?.nickname,
          country: profile?.country,
          language: profile?.language,
          ageRange: profile?.ageRange,
        },
        checkIns,
        journalEntries: journalEntries.map((e) => ({
          date: e.date, body: e.body, emotionTags: e.emotionTags,
          moodTag: e.moodTag, isHidden: e.isHidden, createdAt: e.createdAt,
        })),
      };
      await Share.share({ message: JSON.stringify(payload, null, 2), title: 'HomeWithin — My Data Export' });
    } catch (e: any) {
      if (e?.message !== 'The user did not share') {
        Alert.alert(t('profileCards.exportFailed'), t('profileCards.exportFailedBody'));
      }
    } finally {
      setExporting(false);
    }
  }

  function handleNotificationPrefs() {
    Alert.alert(
      t('profileCards.notifPrefs'),
      t('profileCards.notifPrefsBody'),
      [{ text: t('profileCards.gotIt') }],
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('profileCards.yourData')}</Text>
      <SettingRow
        label={t('profileCards.exportJournal')}
        value={exporting ? t('profileCards.exporting') : ''}
        onPress={handleExportData}
      />
      <SettingRow label={t('profileCards.notifPrefs')} value="" onPress={handleNotificationPrefs} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
});

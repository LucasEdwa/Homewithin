import { Card } from '@/components/ui/Card';
import { SettingRow } from '@/components/profile/SettingRow';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { getCheckIns, getJournalEntries } from '@/services/storage';
import React, { useState } from 'react';
import { Alert, Share, StyleSheet, Text } from 'react-native';

export function ProfileDataCard() {
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
        Alert.alert('Export failed', 'Could not export your data. Please try again.');
      }
    } finally {
      setExporting(false);
    }
  }

  function handleNotificationPrefs() {
    Alert.alert(
      'Notification preferences',
      'Push notifications are not enabled in this version. Stay tuned for future updates.',
      [{ text: 'Got it' }],
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Your data</Text>
      <SettingRow label="Export journal & check-ins" value={exporting ? 'Exporting…' : ''} onPress={handleExportData} />
      <SettingRow label="Notification preferences" value="" onPress={handleNotificationPrefs} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
});

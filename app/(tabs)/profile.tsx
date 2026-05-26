import { ProfileBookmarksCard } from '@/components/profile/ProfileBookmarksCard';
import { ProfileDangerZone, ProfilePrivacyNote } from '@/components/profile/ProfileDangerZone';
import { ProfileDataCard } from '@/components/profile/ProfileDataCard';
import { ProfileIdentityCard } from '@/components/profile/ProfileIdentityCard';
import { ProfilePrivacyCard } from '@/components/profile/ProfilePrivacyCard';
import { SettingRow } from '@/components/profile/SettingRow';
import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { getBookmarkedResources } from '@/services/content/resources';
import type { Resource } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [bookmarks, setBookmarks] = useState<Resource[]>([]);

  useFocusEffect(
    useCallback(() => {
      getBookmarkedResources().then(setBookmarks);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile & Privacy</Text>
        <ProfileIdentityCard />
        <ProfilePrivacyCard />
        <SettingRow
          label="What I'm open to"
          value=""
          onPress={() => router.push('/intentions')}
        />
        <ProfileDataCard />
        <ProfileBookmarksCard bookmarks={bookmarks} />
        <ProfileDangerZone />
        <ProfilePrivacyNote />
        <SettingRow
          label="Become a Professional"
          value=""
          onPress={() => router.push('/(professional)/register' as never)}
        />
        <SettingRow
          label="Terms of Use"
          value=""
          onPress={() => router.push('/terms')}
        />
        <SettingRow
          label="Privacy Policy"
          value=""
          onPress={() => router.push('/terms')}
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

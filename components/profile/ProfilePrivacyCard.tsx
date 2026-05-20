import { Card } from '@/components/ui/Card';
import { SettingRow } from '@/components/profile/SettingRow';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { syncProfile } from '@/services/social/matching';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

export function ProfilePrivacyCard() {
  const { profile, setProfile, pinEnabled, disguiseEnabled } = useSession();
  const [hidingPending, setHidingPending] = useState(false);

  async function handleToggleHideFromSearch(next: boolean) {
    if (!profile || hidingPending) return;
    if (profile.hideFromSearch === next) return;
    setHidingPending(true);
    const optimistic = { ...profile, hideFromSearch: next };
    await setProfile(optimistic);
    try {
      await syncProfile(optimistic);
    } catch (e: any) {
      await setProfile({ ...profile, hideFromSearch: profile.hideFromSearch });
      Alert.alert('Could not update', 'Please check your connection and try again.');
    } finally {
      setHidingPending(false);
    }
  }

  function handlePinRow() {
    if (!pinEnabled) { router.push({ pathname: '/pin', params: { mode: 'setup' } }); return; }
    const options = ['Change PIN', 'Remove PIN', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) router.push({ pathname: '/pin', params: { mode: 'change' } });
          if (idx === 1) router.push({ pathname: '/pin', params: { mode: 'remove' } });
        },
      );
    } else {
      Alert.alert('PIN lock', undefined, [
        { text: 'Change PIN', onPress: () => router.push({ pathname: '/pin', params: { mode: 'change' } }) },
        { text: 'Remove PIN', style: 'destructive', onPress: () => router.push({ pathname: '/pin', params: { mode: 'remove' } }) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Privacy</Text>
      <Pressable
        onPress={() => handleToggleHideFromSearch(!profile?.hideFromSearch)}
        disabled={!profile || hidingPending}
        style={styles.toggleRow}
        accessibilityRole="switch"
        accessibilityState={{ checked: !!profile?.hideFromSearch, disabled: !profile || hidingPending }}
      >
        <View style={styles.toggleInfo} pointerEvents="none">
          <Text style={styles.rowLabel}>Hide from search</Text>
          <Text style={styles.toggleHint}>
            {profile?.hideFromSearch
              ? "You won't appear in anyone's matches. Existing chats stay open."
              : 'People searching for an intention you offer can find you.'}
          </Text>
        </View>
        <View pointerEvents="none">
          <Switch
            value={!!profile?.hideFromSearch}
            onValueChange={handleToggleHideFromSearch}
            disabled={!profile || hidingPending}
            trackColor={{ false: '#D1D5DB', true: Colors.safeBlue }}
            thumbColor={Platform.OS === 'android' ? Colors.white : undefined}
            ios_backgroundColor="#D1D5DB"
          />
        </View>
      </Pressable>
      <SettingRow label="PIN lock" value={pinEnabled ? 'On' : 'Set up'} onPress={handlePinRow} />
      <SettingRow label="App disguise mode" value={disguiseEnabled ? 'On' : 'Off'} onPress={() => router.push('/disguise')} />
      <SettingRow label="Blocked users" value="" onPress={() => router.push('/blocked-users')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  toggleInfo: { flex: 1 },
  rowLabel: { fontSize: 15, color: Colors.textPrimary },
  toggleHint: { fontSize: 12, color: Colors.textMuted, lineHeight: 16, marginTop: 2 },
});

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { signOut } from '@/services/supabase';
import { deleteAccount } from '@/services/user/account';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export function ProfileDangerZone() {
  const { profile, reset } = useSession();
  const [deleting, setDeleting] = useState(false);

  function handleSignOut() {
    Alert.alert(
      'Sign out?',
      "You'll need to sign in again to access your account.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut().catch(() => {});
            reset();
            router.replace('/welcome');
          },
        },
      ],
    );
  }

  function handleDeleteAccount() {
    if (deleting) return;
    Alert.alert(
      'Delete account & all data?',
      'This permanently removes your profile, matches, messages, journal entries, check-ins, safety plan, bookmarks, PIN and disguise settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deleteAccount();
              if (!result.authRowDeleted && result.errors.length > 0) {
                Alert.alert(
                  'Could not delete account',
                  result.errors.join('\n') + '\n\nYour local data was cleared. Contact support if the account persists.',
                  [{ text: 'OK', onPress: () => { reset(); router.replace('/welcome'); } }],
                );
                setDeleting(false);
                return;
              }
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message ?? 'Something went wrong. Please try again.');
              reset();
              setDeleting(false);
              router.replace('/welcome');
            }
            reset();
            setDeleting(false);
            router.replace('/welcome');
          },
        },
      ],
    );
  }

  function handleDeleteGuestData() {
    if (deleting) return;
    Alert.alert(
      'Delete my data & leave?',
      'This will permanently delete everything tied to this guest session — your profile, matches, journal entries, check-ins, and settings.\n\nThis cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try { await deleteAccount(); } catch { /* clear local even if server fails */ }
            reset();
            setDeleting(false);
            router.replace('/welcome');
          },
        },
      ],
    );
  }

  if (profile?.isAnonymous) {
    return (
      <>
        <View style={styles.guestWarning}>
          <Ionicons name="warning-outline" size={18} color="#92610A" style={{ marginTop: 1 }} />
          <Text style={styles.guestWarningText}>
            You're in guest mode. Your data exists only in this session — leaving or deleting permanently removes everything.
          </Text>
        </View>
        <View style={styles.danger}>
          <Button
            label={deleting ? 'Deleting…' : 'Delete my data & leave'}
            variant="danger"
            onPress={handleDeleteGuestData}
            loading={deleting}
            disabled={deleting}
          />
          <Text style={styles.dangerHint}>Permanently deletes your profile, matches, journal, and all session data.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Button label="Sign out" variant="secondary" onPress={handleSignOut} />
      <View style={styles.danger}>
        <Button
          label={deleting ? 'Deleting…' : 'Delete account & all data'}
          variant="danger"
          onPress={handleDeleteAccount}
          loading={deleting}
          disabled={deleting}
        />
        <Text style={styles.dangerHint}>This will permanently wipe all your data and sign you out.</Text>
      </View>
    </>
  );
}

export function ProfilePrivacyNote() {
  return (
    <Card style={styles.privacyNote}>
      <Text style={styles.privacyTitle}>You control your visibility.</Text>
      <Text style={styles.privacyText}>
        HomeWithin stores as little data as possible. Your journal and safety plan live only on your device unless you choose to back them up. You can leave or delete everything at any time.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  danger: { gap: Spacing.sm, alignItems: 'center' },
  dangerHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  guestWarning: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: '#FEF3C7', borderRadius: 10, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  guestWarningText: { flex: 1, fontSize: 13, color: '#92610A', lineHeight: 19 },
  privacyNote: { backgroundColor: Colors.softGreen + '18', borderLeftWidth: 3, borderLeftColor: Colors.softGreen },
  privacyTitle: { fontSize: 15, fontWeight: '600', color: Colors.softGreen },
  privacyText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});

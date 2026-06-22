import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { clearSession } from '@/services/storage';
import { signOut } from '@/services/supabase';
import { deleteAccount } from '@/services/user/account';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function ProfileDangerZone() {
  const { t } = useTranslation();
  const { profile, reset, unlock } = useSession();
  const [deleting, setDeleting] = useState(false);

  function handleSignOut() {
    Alert.alert(
      t('profile.danger.signOutTitle'),
      t('profile.danger.signOutBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.danger.signOutBtn'),
          style: 'destructive',
          onPress: async () => {
            await signOut().catch(() => {});
            await clearSession().catch(() => {});
            unlock();
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
      t('profile.danger.deleteAccountTitle'),
      t('profile.danger.deleteAccountBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.danger.deleteEverything'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deleteAccount();
              if (!result.authRowDeleted && result.errors.length > 0) {
                Alert.alert(
                  t('profile.danger.couldNotDelete'),
                  result.errors.join('\n') + '\n\n' + t('profile.danger.couldNotDeleteBody'),
                  [{ text: t('common.ok'), onPress: () => { reset(); router.replace('/welcome'); } }],
                );
                setDeleting(false);
                return;
              }
            } catch (e: any) {
              Alert.alert(t('profile.danger.deleteFailed'), e?.message ?? 'Something went wrong. Please try again.');
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
      t('profile.danger.deleteGuestTitle'),
      t('profile.danger.deleteGuestBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.danger.deleteEverything'),
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
          <Text style={styles.guestWarningText}>{t('profile.danger.guestWarning')}</Text>
        </View>
        <View style={styles.danger}>
          <Button
            label={deleting ? t('profile.danger.deleting') : t('profile.danger.deleteGuestBtn')}
            variant="danger"
            onPress={handleDeleteGuestData}
            loading={deleting}
            disabled={deleting}
          />
          <Text style={styles.dangerHint}>{t('profile.danger.deleteGuestHint')}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Button label={t('profile.danger.signOutBtn')} variant="secondary" onPress={handleSignOut} />
      <View style={styles.danger}>
        <Button
          label={deleting ? t('profile.danger.deleting') : t('profile.danger.deleteAccountBtn')}
          variant="danger"
          onPress={handleDeleteAccount}
          loading={deleting}
          disabled={deleting}
        />
        <Text style={styles.dangerHint}>{t('profile.danger.deleteAccountHint')}</Text>
      </View>
    </>
  );
}

export function ProfilePrivacyNote() {
  const { t } = useTranslation();
  return (
    <Card style={styles.privacyNote}>
      <Text style={styles.privacyTitle}>{t('profile.privacyNote.title')}</Text>
      <Text style={styles.privacyText}>{t('profile.privacyNote.body')}</Text>
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

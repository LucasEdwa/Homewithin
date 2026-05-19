import { EmergencyButton } from '@/components/EmergencyButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { deleteAccount } from '@/services/account';
import { uploadAvatar } from '@/services/avatar';
import { syncProfile } from '@/services/matching';
import { signOut } from '@/services/supabase';
import { getBookmarkedResources } from '@/services/resources';
import { getCheckIns, getJournalEntries } from '@/services/storage';
import type { Resource } from '@/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const { profile, setProfile, reset, pinEnabled, disguiseEnabled } = useSession();
  const [bookmarks, setBookmarks] = useState<Resource[]>([]);
  const [hidingPending, setHidingPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getBookmarkedResources().then(setBookmarks);
    }, [])
  );

  async function handlePickAvatar() {
    if (avatarUploading) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Allow photo access in Settings to set a profile photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;

    // Optimistic local update so the avatar appears instantly.
    if (profile) {
      await setProfile({ ...profile, avatarUrl: localUri });
    }

    setAvatarUploading(true);
    try {
      const remoteUrl = await uploadAvatar(localUri);
      if (profile) {
        const updated = { ...profile, avatarUrl: remoteUrl };
        await setProfile(updated);
        await syncProfile(updated).catch(() => {});
      }
    } catch {
      // Keep the local URI as a fallback — upload failed silently.
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleChangeNickname() {
    if (!profile) return;
    Alert.prompt(
      'Change nickname',
      'Enter a new anonymous nickname (no real names).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (text: string | undefined) => {
            const trimmed = text?.trim();
            if (!trimmed || trimmed.length < 2) {
              Alert.alert('Too short', 'Nickname must be at least 2 characters.');
              return;
            }
            if (trimmed.length > 30) {
              Alert.alert('Too long', 'Nickname must be 30 characters or fewer.');
              return;
            }
            const updated = { ...profile, nickname: trimmed };
            await setProfile(updated);
            await syncProfile(updated).catch(() => {});
          },
        },
      ],
      'plain-text',
      profile.nickname
    );
  }

  async function handleExportData() {
    if (exporting) return;
    setExporting(true);
    try {
      const [checkIns, journalEntries] = await Promise.all([
        getCheckIns(),
        getJournalEntries(),
      ]);
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
          date: e.date,
          body: e.body,
          emotionTags: e.emotionTags,
          moodTag: e.moodTag,
          isHidden: e.isHidden,
          createdAt: e.createdAt,
        })),
      };
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: 'HomeWithin — My Data Export',
      });
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
      [{ text: 'Got it' }]
    );
  }

  function handleSignOut() {
    Alert.alert(
      'Sign out?',
      'You\'ll need to sign in again to access your account.',
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
      ]
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
                  [{ text: 'OK', onPress: () => { reset(); router.replace('/welcome'); } }]
                );
                setDeleting(false);
                return;
              }
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message ?? 'Something went wrong. Please try again.');
              setDeleting(false);
              return;
            }
            reset();
            setDeleting(false);
            router.replace('/welcome');
          },
        },
      ]
    );
  }

  async function handleToggleHideFromSearch(next: boolean) {
    console.log('[hide-toggle] onValueChange fired with', next, 'profile?', !!profile, 'pending?', hidingPending);
    if (!profile || hidingPending) return;
    const prev = profile.hideFromSearch;
    if (prev === next) return;

    // Optimistic update so the switch feels instant.
    setHidingPending(true);
    const optimistic = { ...profile, hideFromSearch: next };
    console.log('[hide-toggle] calling setProfile with hideFromSearch=', next);
    await setProfile(optimistic);
    console.log('[hide-toggle] setProfile resolved');

    try {
      await syncProfile(optimistic);
      console.log('[hide-toggle] syncProfile resolved');
    } catch (e: any) {
      // Roll back on failure.
      await setProfile({ ...profile, hideFromSearch: prev });
      Alert.alert(
        'Could not update',
        'Please check your connection and try again.'
      );
      console.error('Hide-from-search sync failed:', e?.message);
    } finally {
      setHidingPending(false);
    }
  }

  function handlePinRow() {
    if (!pinEnabled) {
      router.push({ pathname: '/pin', params: { mode: 'setup' } });
      return;
    }
    const options = ['Change PIN', 'Remove PIN', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) router.push({ pathname: '/pin', params: { mode: 'change' } });
          if (idx === 1) router.push({ pathname: '/pin', params: { mode: 'remove' } });
        }
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile & Privacy</Text>

        {/* Identity */}
        <Card elevated style={styles.section}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            accessibilityLabel="Change profile photo"
            accessibilityRole="button"
            accessibilityHint="Double tap to choose a photo from your library"
            style={styles.avatarWrapper}
          >
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.nickname?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              {avatarUploading ? (
                <ActivityIndicator size={12} color={Colors.white} />
              ) : (
                <Ionicons name="camera" size={12} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleChangeNickname}
            accessibilityLabel="Change nickname"
            accessibilityRole="button"
            accessibilityHint="Double tap to change your anonymous nickname"
          >
            <Text style={styles.nickname}>{profile?.nickname ?? 'Anonymous'}</Text>
            <Text style={styles.nicknameHint}>Tap to change nickname</Text>
          </TouchableOpacity>
          {profile?.pronouns ? <Text style={styles.pronouns}>{profile.pronouns}</Text> : null}
          <Text style={styles.meta}>{profile?.country ?? ''} · {profile?.ageRange ?? ''}</Text>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Pressable
            onPress={() => {
              console.log('[hide-toggle] row pressed, current=', !!profile?.hideFromSearch);
              handleToggleHideFromSearch(!profile?.hideFromSearch);
            }}
            disabled={!profile || hidingPending}
            style={styles.toggleRow}
            accessibilityRole="switch"
            accessibilityState={{ checked: !!profile?.hideFromSearch, disabled: !profile || hidingPending }}
          >
            <View style={styles.toggleInfo} pointerEvents="none">
              <Text style={styles.rowLabel}>Hide from search</Text>
              <Text style={styles.toggleHint}>
                {profile?.hideFromSearch
                  ? 'You won\'t appear in anyone\'s matches. Existing chats stay open.'
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
                accessibilityLabel="Hide from search"
              />
            </View>
          </Pressable>
          <SettingRow label="PIN lock" value={pinEnabled ? 'On' : 'Set up'} onPress={handlePinRow} />
          <SettingRow label="App disguise mode" value={disguiseEnabled ? 'On' : 'Off'} onPress={() => router.push('/disguise')} />
          <SettingRow
            label="Blocked users"
            value=""
            onPress={() => router.push('/blocked-users')}
          />
        </Card>

        {/* Matching preferences */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Matching</Text>
          <SettingRow
            label="What I'm open to"
            value={`${profile?.intentions?.length ?? 0} selected`}
            onPress={() => router.push('/intentions')}
          />
        </Card>

        {/* Data */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Your data</Text>
          <SettingRow
            label="Export journal & check-ins"
            value={exporting ? 'Exporting…' : ''}
            onPress={handleExportData}
          />
          <SettingRow label="Notification preferences" value="" onPress={handleNotificationPrefs} />
        </Card>

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Saved articles</Text>
            {bookmarks.map((article) => {
              const color = CATEGORY_COLORS[article.category];
              return (
                <TouchableOpacity
                  key={article.id}
                  style={styles.bookmarkRow}
                  onPress={() => router.push({ pathname: '/article', params: { id: article.id } })}
                  accessibilityLabel={article.title}
                >
                  <View style={[styles.bookmarkDot, { backgroundColor: color }]} />
                  <View style={styles.bookmarkInfo}>
                    <Text style={styles.bookmarkTitle} numberOfLines={1}>{article.title}</Text>
                    <Text style={styles.bookmarkCat}>{CATEGORY_LABELS[article.category]}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </Card>
        )}

        {/* Sign out */}
        <Button
          label="Sign out"
          variant="secondary"
          onPress={handleSignOut}
        />

        {/* Danger zone */}
        <View style={styles.danger}>
          <Button
            label={deleting ? 'Deleting…' : 'Delete account & all data'}
            variant="danger"
            onPress={handleDeleteAccount}
            loading={deleting}
            disabled={deleting}
          />
          <Text style={styles.dangerHint}>
            This will permanently wipe all your data and sign you out.
          </Text>
        </View>

        {/* Privacy explanation */}
        <Card style={[styles.section, styles.privacyNote]}>
          <Text style={styles.privacyTitle}>You control your visibility.</Text>
          <Text style={styles.privacyText}>
            HomeWithin stores as little data as possible. Your journal and safety plan live only on your device unless you choose to back them up. You can leave or delete everything at any time.
          </Text>
        </Card>
      </ScrollView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} accessibilityLabel={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  section: { gap: Spacing.sm },
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.warmWhite,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.white },
  nickname: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  nicknameHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  pronouns: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  meta: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: 15, color: Colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 14, color: Colors.textMuted },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleInfo: { flex: 1 },
  toggleHint: { fontSize: 12, color: Colors.textMuted, lineHeight: 16, marginTop: 2 },
  danger: { gap: Spacing.sm, alignItems: 'center' },
  dangerHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  privacyNote: { backgroundColor: Colors.softGreen + '18', borderLeftWidth: 3, borderLeftColor: Colors.softGreen },
  privacyTitle: { fontSize: 15, fontWeight: '600', color: Colors.softGreen },
  privacyText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  bookmarkDot: { width: 8, height: 8, borderRadius: 4 },
  bookmarkInfo: { flex: 1 },
  bookmarkTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  bookmarkCat: { fontSize: 12, color: Colors.textMuted },
});

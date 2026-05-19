import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { uploadAvatar } from '@/services/avatar';
import { syncProfile } from '@/services/matching';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function ProfileIdentityCard() {
  const { profile, setProfile } = useSession();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => { setAvatarLoadFailed(false); }, [profile?.avatarUrl]);

  async function handlePickAvatar() {
    if (avatarUploading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access in Settings to set a profile photo.', [{ text: 'OK' }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const localUri = asset.uri;
    const previousAvatarUrl = profile?.avatarUrl;
    if (profile) await setProfile({ ...profile, avatarUrl: localUri });

    setAvatarUploading(true);
    try {
      const remoteUrl = await uploadAvatar(localUri, asset.mimeType ?? undefined);
      if (profile) {
        const updated = { ...profile, avatarUrl: remoteUrl };
        await setProfile(updated);
        await syncProfile(updated).catch(() => {});
      }
    } catch (e: any) {
      if (profile) await setProfile({ ...profile, avatarUrl: previousAvatarUrl });
      Alert.alert('Upload failed', e?.message ?? 'Could not save your photo. Please try again.');
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
            if (!trimmed || trimmed.length < 2) { Alert.alert('Too short', 'Nickname must be at least 2 characters.'); return; }
            if (trimmed.length > 30) { Alert.alert('Too long', 'Nickname must be 30 characters or fewer.'); return; }
            const updated = { ...profile, nickname: trimmed };
            await setProfile(updated);
            await syncProfile(updated).catch(() => {});
          },
        },
      ],
      'plain-text',
      profile.nickname,
    );
  }

  return (
    <Card elevated style={styles.card}>
      <TouchableOpacity
        onPress={handlePickAvatar}
        activeOpacity={0.8}
        accessibilityLabel="Change profile photo"
        accessibilityRole="button"
        style={styles.avatarWrapper}
      >
        {profile?.avatarUrl && !avatarLoadFailed ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={200}
            onError={() => setAvatarLoadFailed(true)}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.nickname?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={styles.avatarBadge}>
          {avatarUploading
            ? <ActivityIndicator size={12} color={Colors.white} />
            : <Ionicons name="camera" size={12} color={Colors.white} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleChangeNickname} accessibilityLabel="Change nickname" accessibilityRole="button">
        <Text style={styles.nickname}>{profile?.nickname ?? 'Anonymous'}</Text>
        <Text style={styles.nicknameHint}>Tap to change nickname</Text>
      </TouchableOpacity>
      {profile?.pronouns ? <Text style={styles.pronouns}>{profile.pronouns}</Text> : null}
      <Text style={styles.meta}>{profile?.country ?? ''} · {profile?.ageRange ?? ''}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  avatarWrapper: { alignSelf: 'center', marginBottom: Spacing.sm, position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.safeBlue, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.warmWhite,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.white },
  nickname: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  nicknameHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  pronouns: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  meta: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});

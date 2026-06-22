import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { uploadAvatar } from '@/services/user/avatar';
import { syncProfile } from '@/services/social/matching';
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
import { useTranslation } from 'react-i18next';

export function ProfileIdentityCard() {
  const { t } = useTranslation();
  const { profile, setProfile } = useSession();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => { setAvatarLoadFailed(false); }, [profile?.avatarUrl]);

  async function handlePickAvatar() {
    if (avatarUploading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.identity.permissionNeeded'), t('profile.identity.photoPermission'), [{ text: t('common.ok') }]);
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
        await syncProfile(updated);
      }
    } catch (e: any) {
      if (profile) await setProfile({ ...profile, avatarUrl: previousAvatarUrl });
      Alert.alert(t('profile.identity.uploadFailed'), e?.message ?? t('profile.identity.couldNotSavePhoto'));
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleChangeNickname() {
    if (!profile) return;
    Alert.prompt(
      t('profile.identity.changeNickname'),
      t('profile.identity.changeNicknameBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: async (text: string | undefined) => {
            const trimmed = text?.trim();
            if (!trimmed || trimmed.length < 2) { Alert.alert(t('profile.identity.tooShort'), t('profile.identity.nicknameTooShort')); return; }
            if (trimmed.length > 30) { Alert.alert(t('profile.identity.tooLong'), t('profile.identity.nicknameTooLong')); return; }
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
        accessibilityLabel={t('profile.identity.changePhoto')}
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
        <Text style={styles.nickname}>{profile?.nickname ?? t('common.anonymous')}</Text>
        <Text style={styles.nicknameHint}>{t('profile.identity.tapToChangeNickname')}</Text>
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

import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function PeerAvatar({
  avatarUrl,
  nickname,
  size = 44,
}: {
  avatarUrl?: string;
  nickname?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const radius = size / 2;

  if (avatarUrl && !failed) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>
        {(nickname?.[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontWeight: '700', color: Colors.white },
});

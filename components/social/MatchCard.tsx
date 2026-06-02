import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import type { PeerProfile } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PeerAvatar } from './PeerAvatar';

interface Props {
  peer: PeerProfile;
  remaining: number;
  onConnect: () => void;
  onPass: () => void;
  onReport?: () => void;
}

export function MatchCard({ peer, remaining, onConnect, onPass, onReport }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.remaining}>
          {remaining} {remaining === 1 ? 'person' : 'people'} nearby
        </Text>
        {onReport && (
          <TouchableOpacity
            onPress={onReport}
            style={styles.reportBtn}
            accessibilityLabel="More options"
            testID="report-profile-btn"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.avatarWrap}>
        <PeerAvatar avatarUrl={peer.avatarUrl} nickname={peer.nickname} size={120} />
      </View>

      <Text style={styles.nickname}>{peer.nickname}</Text>

      <View style={styles.meta}>
        {peer.ageRange ? (
          <View style={styles.chip}>
            <Ionicons name="person-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.chipText}>{peer.ageRange}</Text>
          </View>
        ) : null}
        {peer.country ? (
          <View style={styles.chip}>
            <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.chipText}>{peer.country}</Text>
          </View>
        ) : null}
        {peer.language ? (
          <View style={styles.chip}>
            <Ionicons name="language-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.chipText}>{peer.language}</Text>
          </View>
        ) : null}
      </View>

      {peer.needs.length > 0 && (
        <View style={styles.needs}>
          {peer.needs.slice(0, 3).map((need) => (
            <View key={need} style={styles.needChip}>
              <Text style={styles.needChipText}>{need.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.passBtn}
          onPress={onPass}
          accessibilityLabel="Pass"
          testID="pass-btn"
        >
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
          <Text style={styles.passBtnText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={onConnect}
          accessibilityLabel="Connect"
          testID="connect-btn"
        >
          <Ionicons name="heart" size={24} color={Colors.black} />
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  remaining: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  reportBtn: {
    padding: 4,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nickname: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  chipText: { fontSize: 12, color: Colors.textMuted },
  needs: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' },
  needChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  needChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  divider: { width: '100%', height: 1, backgroundColor: Colors.border, marginTop: Spacing.xs },
  actions: { flexDirection: 'row', gap: Spacing.xl, paddingVertical: Spacing.sm },
  passBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 4,
  },
  passBtnText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.3 },
  connectBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    gap: 4,
  },
  connectBtnText: { fontSize: 10, color: Colors.black, fontWeight: '700', letterSpacing: 0.3 },
});

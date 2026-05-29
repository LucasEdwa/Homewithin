import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import type { Match } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PeerAvatar } from './PeerAvatar';

interface Props {
  matches: Match[];
  onAccept: (match: Match) => void;
  onDecline: (match: Match) => void;
}

export function IncomingLikesSection({ matches, onAccept, onDecline }: Props) {
  if (matches.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>People who liked you</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{matches.length}</Text>
        </View>
      </View>
      {matches.map((match) => (
        <View key={match.id} style={styles.row} testID={`incoming-${match.id}`}>
          <PeerAvatar avatarUrl={match.peer?.avatarUrl} nickname={match.peer?.nickname} />
          <View style={styles.info}>
            <Text style={styles.name}>{match.peer?.nickname ?? 'Someone'}</Text>
            {match.peer?.country ? <Text style={styles.meta}>{match.peer.country}</Text> : null}
          </View>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => onDecline(match)}
            accessibilityLabel="Decline"
            testID={`decline-${match.id}`}
          >
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => onAccept(match)}
            accessibilityLabel="Accept"
            testID={`accept-${match.id}`}
          >
            <Ionicons name="heart" size={16} color={Colors.white} />
            <Text style={styles.acceptText}>Connect</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.mutedLavender,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textMuted },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.safeBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  acceptText: { fontSize: 12, fontWeight: '700', color: Colors.white },
});

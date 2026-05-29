import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import type { Match } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PeerAvatar } from './PeerAvatar';

interface Props {
  matches: Match[];
  unreadByMatch: Record<string, number>;
  onUnmatch: (match: Match) => void;
}

export function ConnectionsSection({ matches, unreadByMatch, onUnmatch }: Props) {
  if (matches.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Your connections</Text>
      {matches.map((match) => {
        const unread = unreadByMatch[match.id] ?? 0;
        return (
          <View key={match.id} style={styles.row}>
            <TouchableOpacity
              style={styles.chatArea}
              testID={`match-${match.id}`}
              onPress={() =>
                router.push({
                  pathname: '/chat',
                  params: {
                    matchId: match.id,
                    nickname: match.peer?.nickname ?? 'Someone',
                    avatarUrl: match.peer?.avatarUrl ?? '',
                  },
                })
              }
              accessibilityLabel={`Chat with ${match.peer?.nickname ?? 'Someone'}`}
            >
              <PeerAvatar avatarUrl={match.peer?.avatarUrl} nickname={match.peer?.nickname} />
              <View style={styles.info}>
                <Text style={[styles.name, unread > 0 && styles.nameUnread]}>
                  {match.peer?.nickname ?? 'Someone'}
                </Text>
                {match.peer?.country ? <Text style={styles.meta}>{match.peer.country}</Text> : null}
              </View>
              {unread > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              ) : (
                <Ionicons name="chatbubble-outline" size={18} color={Colors.safeBlue} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.unmatchBtn}
              onPress={() => onUnmatch(match)}
              accessibilityLabel="Unmatch"
              testID={`unmatch-${match.id}`}
            >
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  chatArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  nameUnread: { fontWeight: '700' },
  meta: { fontSize: 12, color: Colors.textMuted },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  unmatchBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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

function formatLastMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ConnectionsSection({ matches, unreadByMatch, onUnmatch }: Props) {
  if (matches.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Connections</Text>
      {matches.map((match) => {
        const unread = unreadByMatch[match.id] ?? 0;
        const lastMsg = match.lastMessage;
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
                <View style={styles.nameRow}>
                  <Text style={[styles.name, unread > 0 && styles.nameUnread]} numberOfLines={1}>
                    {match.peer?.nickname ?? 'Someone'}
                  </Text>
                  {lastMsg ? (
                    <Text style={styles.time}>{formatLastMessageTime(lastMsg.createdAt)}</Text>
                  ) : null}
                </View>
                {lastMsg ? (
                  <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={1}>
                    {lastMsg.body}
                  </Text>
                ) : (
                  <Text style={styles.preview}>Tap to say hello</Text>
                )}
              </View>
              {unread > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              ) : null}
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
    alignItems: 'stretch',
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
  info: { flex: 1, gap: 2 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  nameUnread: { fontWeight: '700' },
  time: { fontSize: 11, color: Colors.textMuted, flexShrink: 0 },
  preview: { fontSize: 13, color: Colors.textMuted, lineHeight: 17 },
  previewUnread: { color: Colors.textSecondary, fontWeight: '500' },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: Spacing.xs,
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

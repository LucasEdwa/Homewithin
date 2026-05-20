import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { getBlockedUsers, unblockUser } from '@/services/social/matching';
import type { BlockedUser } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BlockedUsersScreen() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const list = await getBlockedUsers();
    setUsers(list);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmUnblock(user: BlockedUser) {
    Alert.alert(
      `Unblock ${user.nickname}?`,
      'They will be able to appear in matches and contact you again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setPending((p) => ({ ...p, [user.userId]: true }));
            const ok = await unblockUser(user.userId);
            setPending((p) => ({ ...p, [user.userId]: false }));
            if (!ok) {
              Alert.alert('Unblock failed', 'Please check your connection and try again.');
              return;
            }
            setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Blocked users</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={Colors.safeBlue} style={{ marginTop: Spacing.xl }} />
        ) : users.length === 0 ? (
          <Card style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={28} color={Colors.softGreen} />
            <Text style={styles.emptyTitle}>No blocked users</Text>
            <Text style={styles.emptyText}>
              People you block will appear here. You can unblock them anytime.
            </Text>
          </Card>
        ) : (
          <Card style={styles.list}>
            {users.map((user, idx) => (
              <View
                key={user.userId}
                style={[styles.row, idx === users.length - 1 && styles.rowLast]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.nickname[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.nickname} numberOfLines={1}>{user.nickname}</Text>
                  <Text style={styles.meta}>Blocked {formatDate(user.createdAt)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmUnblock(user)}
                  style={styles.unblockBtn}
                  disabled={pending[user.userId]}
                  accessibilityLabel={`Unblock ${user.nickname}`}
                >
                  {pending[user.userId] ? (
                    <ActivityIndicator color={Colors.safeBlue} size="small" />
                  ) : (
                    <Text style={styles.unblockText}>Unblock</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  list: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  info: { flex: 1 },
  nickname: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textMuted },
  unblockBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.safeBlue,
    minWidth: 80,
    alignItems: 'center',
  },
  unblockText: { fontSize: 14, fontWeight: '600', color: Colors.safeBlue },
});

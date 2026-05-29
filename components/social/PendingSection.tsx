import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import type { Match } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  matches: Match[];
  onCancel: (match: Match) => void;
}

export function PendingSection({ matches, onCancel }: Props) {
  if (matches.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Waiting for response</Text>
      {matches.map((match) => (
        <View key={match.id} style={styles.row} testID={`pending-${match.id}`}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>
              {(match.peer?.nickname?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{match.peer?.nickname ?? 'Someone'}</Text>
            <Text style={styles.meta}>Waiting for them to connect back…</Text>
          </View>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(match)}
            accessibilityLabel="Cancel request"
            testID={`cancel-pending-${match.id}`}
          >
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 18, fontWeight: '700', color: Colors.textMuted },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textMuted },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

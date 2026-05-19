import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.right}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { fontSize: 15, color: Colors.textPrimary },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontSize: 14, color: Colors.textMuted },
});

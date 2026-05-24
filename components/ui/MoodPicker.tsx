import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoodLevel, MOOD_LABELS, MOOD_ICONS, MOOD_COLORS } from '@/types';
import { Spacing } from '@/constants/Spacing';
import { Colors } from '@/constants/Colors';

interface MoodPickerProps {
  value: MoodLevel | null;
  onChange: (level: MoodLevel) => void;
}

const LEVELS: MoodLevel[] = [1, 2, 3, 4, 5];

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <View style={styles.row}>
      {LEVELS.map((level) => {
        const selected = value === level;
        const color = MOOD_COLORS[level];
        return (
          <TouchableOpacity
            key={level}
            style={styles.item}
            onPress={() => onChange(level)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityLabel={MOOD_LABELS[level]}
            accessibilityState={{ selected }}
          >
            <Ionicons name={MOOD_ICONS[level]} size={34} color={selected ? color : Colors.textMuted} />
            <Text style={[styles.label, selected && { color }]}>{MOOD_LABELS[level]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

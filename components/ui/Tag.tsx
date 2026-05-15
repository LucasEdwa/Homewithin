import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';

interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Tag({ label, selected = false, onPress, style }: TagProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tag, selected && styles.selected, style]}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.softGray,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selected: {
    backgroundColor: Colors.safeBlue + '18',
    borderColor: Colors.safeBlue,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  selectedText: {
    color: Colors.safeBlue,
  },
});

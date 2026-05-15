import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

interface RangeSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  onValueChange: (v: number) => void;
  color?: string;
}

export function RangeSlider({
  label,
  value,
  min = 1,
  max = 10,
  minLabel,
  maxLabel,
  onValueChange,
  color = Colors.safeBlue,
}: RangeSliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={Colors.softGray}
        thumbTintColor={color}
        accessibilityLabel={label}
      />
      {(minLabel || maxLabel) && (
        <View style={styles.labels}>
          {minLabel ? <Text style={styles.rangeLabel}>{minLabel}</Text> : <View />}
          {maxLabel ? <Text style={styles.rangeLabel}>{maxLabel}</Text> : <View />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  value: { fontSize: 16, fontWeight: '700' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  rangeLabel: { fontSize: 10, color: Colors.textMuted },
});

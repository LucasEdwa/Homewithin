import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

interface SafetySliderProps {
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  trackColor?: string;
}

export function SafetySlider({
  label,
  minLabel,
  maxLabel,
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 10,
  step = 1,
  trackColor,
}: SafetySliderProps) {
  const resolvedTrack = trackColor ?? interpolateColor(value, minimumValue, maximumValue);

  return (
    <View style={styles.container} accessibilityLabel={label}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={resolvedTrack}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={resolvedTrack}
        accessibilityLabel={label}
      />
      {(minLabel || maxLabel) && (
        <View style={styles.labels}>
          {minLabel && <Text style={styles.rangeLabel}>{minLabel}</Text>}
          {maxLabel && <Text style={styles.rangeLabel}>{maxLabel}</Text>}
        </View>
      )}
    </View>
  );
}

function interpolateColor(value: number, min: number, max: number): string {
  const ratio = (value - min) / (max - min);
  if (ratio < 0.4) return Colors.safetyRed;
  if (ratio < 0.7) return Colors.safetyYellow;
  return Colors.safetyGreen;
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';

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
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const pct = (value - min) / (max - min);

  return (
    <View style={styles.container} accessibilityLabel={label}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>{value}<Text style={styles.maxText}>/{max}</Text></Text>
      </View>

      <View style={styles.track}>
        {steps.map((step) => {
          const active = step <= value;
          const isSelected = step === value;
          const opacity = active ? 0.15 + (step / max) * 0.55 : 0.07;
          return (
            <TouchableOpacity
              key={step}
              onPress={() => onValueChange(step)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityLabel={`${label} ${step}`}
              accessibilityState={{ selected: isSelected }}
              style={styles.segmentWrap}
            >
              <View
                style={[
                  styles.segment,
                  { backgroundColor: `rgba(255,255,255,${opacity})` },
                  isSelected && styles.segmentSelected,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

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
  container: { gap: Spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  valueText: { fontSize: 20, fontWeight: '800', lineHeight: 24, color: Colors.textPrimary },
  maxText: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },

  track: {
    flexDirection: 'row',
    gap: 4,
    height: 28,
    alignItems: 'center',
  },
  segmentWrap: { flex: 1, height: '100%', justifyContent: 'center' },
  segment: {
    height: 6,
    borderRadius: Radius.full,
  },
  segmentSelected: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
});

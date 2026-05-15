import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PIN_LENGTH = 4;
const KEYS: (string | 'back')[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

interface Props {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
  shake?: boolean;
  testIDPrefix?: string;
}

export function PinPad({ value, onChange, maxLength = PIN_LENGTH, shake, testIDPrefix = 'pin' }: Props) {
  function press(k: string | 'back') {
    if (k === 'back') {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === '') return;
    if (value.length >= maxLength) return;
    onChange(value + k);
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.dots, shake && styles.dotsShake]}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < value.length && styles.dotFilled,
              shake && styles.dotShake,
            ]}
          />
        ))}
      </View>

      <View style={styles.grid}>
        {KEYS.map((k, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.key, k === '' && styles.keyEmpty]}
            onPress={() => press(k)}
            disabled={k === ''}
            activeOpacity={0.6}
            accessibilityLabel={
              k === 'back' ? 'Delete' : k === '' ? 'empty' : `Number ${k}`
            }
            testID={`${testIDPrefix}-${k === 'back' ? 'back' : k || 'empty'}`}
          >
            {k === 'back' ? (
              <Ionicons name="backspace-outline" size={22} color={Colors.textPrimary} />
            ) : (
              <Text style={styles.keyText}>{k}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.lg },
  dots: { flexDirection: 'row', gap: Spacing.md },
  dotsShake: {},
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: Colors.safeBlue, borderColor: Colors.safeBlue },
  dotShake: { borderColor: Colors.alertRed },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260,
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent' },
  keyText: { fontSize: 28, fontWeight: '500', color: Colors.textPrimary },
});

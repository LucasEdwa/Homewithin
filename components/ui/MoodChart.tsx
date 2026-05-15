import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckIn, MOOD_COLORS } from '@/types';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';

interface MoodChartProps {
  checkIns: CheckIn[];
}

const MAX_HEIGHT = 72;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

export function MoodChart({ checkIns }: MoodChartProps) {
  const days = last7Days();
  const byDate: Record<string, CheckIn> = {};
  checkIns.forEach((c) => { byDate[c.date] = c; });

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {days.map((date) => {
          const entry = byDate[date];
          const score = entry?.moodScore ?? 0;
          const barHeight = score > 0 ? (score / 5) * MAX_HEIGHT : 4;
          const color = score > 0 ? MOOD_COLORS[entry.moodScore] : Colors.softGray;
          const dayLabel = DAY_LABELS[new Date(date + 'T12:00:00').getDay()];
          const isToday = date === days[6];

          return (
            <View key={date} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight, backgroundColor: color },
                    !entry && styles.emptyBar,
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {isToday ? 'Today' : dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    height: MAX_HEIGHT + 28,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    height: MAX_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderRadius: Radius.sm,
    minHeight: 4,
  },
  emptyBar: {
    opacity: 0.3,
  },
  dayLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dayLabelToday: {
    color: Colors.safeBlue,
    fontWeight: '700',
  },
});

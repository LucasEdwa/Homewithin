import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { CheckIn, MoodDataPoint, MOOD_COLORS, MOOD_LABELS } from '@/types';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { useState } from 'react';

interface MoodChartProps {
  checkIns?: CheckIn[];
  dataPoints?: MoodDataPoint[];
  days?: number;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

export function MoodChart({ checkIns, dataPoints, days = 7 }: MoodChartProps) {
  const [trackW, setTrackW] = useState(0);
  const dateList = lastNDays(days);

  // Build score map from whichever source is provided
  const scoreByDate: Record<string, number> = {};
  if (dataPoints) {
    dataPoints.forEach((p) => { scoreByDate[p.date] = p.mood; });
  } else if (checkIns) {
    checkIns.forEach((c) => { scoreByDate[c.date] = c.moodScore; });
  }

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {dateList.map((date, i) => {
        const score = scoreByDate[date] ?? 0;
        const isToday = i === dateList.length - 1;
        const dayIdx = new Date(date + 'T12:00:00').getDay();
        const label = isToday ? 'Today' : DAY_SHORT[dayIdx];
        const color = score > 0 ? MOOD_COLORS[score as 1|2|3|4|5] : 'rgba(255,255,255,0.06)';
        const fillPct = score > 0 ? score / 5 : 0;
        const moodLabel = score > 0 ? MOOD_LABELS[score as 1|2|3|4|5] : null;

        return (
          <View key={date} style={styles.row}>
            {/* Day label */}
            <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
              {label}
            </Text>

            {/* Fill track */}
            <View style={styles.track}>
              <View style={styles.trackBg} />
              {score > 0 && (
                <View
                  style={[
                    styles.fill,
                    {
                      width: trackW > 0 ? fillPct * trackW : `${fillPct * 100}%` as any,
                      backgroundColor: color,
                    },
                  ]}
                />
              )}
            </View>

            {/* Mood label */}
            <Text style={[styles.scoreLabel, score > 0 && { color }]}>
              {moodLabel ?? '—'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingVertical: Spacing.xs },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  dayLabel: {
    width: 34,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    textAlign: 'right',
  },
  dayLabelToday: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },

  track: {
    flex: 1,
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  trackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.full,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
    opacity: 0.85,
  },

  scoreLabel: {
    width: 52,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

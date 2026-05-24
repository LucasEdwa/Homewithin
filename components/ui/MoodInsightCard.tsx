import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import type { CheckIn, MoodLevel } from '@/types';
import { MOOD_COLORS, MOOD_LABELS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface MoodInsightCardProps {
  todayCheckIn: CheckIn | null;
  recentCheckIns: CheckIn[];
  onPress?: () => void;
}

// ─── Headline copy mapped from mood score ─────────────────────────────────────

const HEADLINES: Record<MoodLevel, string> = {
  5: "You're doing really well",
  4: 'Things are looking good',
  3: 'Holding steady today',
  2: 'A difficult stretch',
  1: 'You deserve support right now',
};

const BODY_COPY: Record<MoodLevel, string> = {
  5: "Your mood is above your usual range. Take a moment to notice what's been helping.",
  4: 'Above average today. Small positive patterns are adding up.',
  3: "Middle ground — not your best, not your worst. Check in on what might shift this.",
  2: "Your mood is lower than usual. Small things can help — journaling, a check-in, or talking to someone.",
  1: "This is a hard place to be. You're not alone. Reaching out matters.",
};

// ─── Build last-7-days data ────────────────────────────────────────────────────

function buildChartData(checkIns: CheckIn[]): { date: string; value: number | null }[] {
  const byDate: Record<string, number> = {};
  checkIns.forEach((c) => { byDate[c.date] = c.moodScore; });

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return { date: key, value: byDate[key] ?? null };
  });
}

// ─── Line chart (pure RN — rotated views) ─────────────────────────────────────

const CHART_H = 72;
const CHART_PAD_X = 4;
const DOT_R = 4;

function MoodLineChart({ data }: { data: { date: string; value: number | null }[] }) {
  const [chartW, setChartW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width);

  const plotW = chartW - CHART_PAD_X * 2;
  const plotH = CHART_H - 8;
  const n = data.length;

  function xFor(i: number) {
    return CHART_PAD_X + (i / (n - 1)) * plotW;
  }
  function yFor(v: number) {
    return plotH - ((v - 1) / 4) * plotH + 4;
  }

  // Collect valid points
  const points = data.map((d, i) =>
    d.value !== null ? { x: xFor(i), y: yFor(d.value), v: d.value as MoodLevel, date: d.date } : null
  );

  // Build line segments between consecutive valid points
  const segments: { cx: number; cy: number; len: number; angle: number; color: string }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    const len = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
    segments.push({
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
      len,
      angle,
      color: MOOD_COLORS[b.v],
    });
  }

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View onLayout={onLayout}>
      {/* Chart area */}
      <View style={{ height: CHART_H, position: 'relative' }}>
        {chartW > 0 && (
          <>
            {/* Horizontal reference grid */}
            {[1, 2, 3, 4, 5].map((v) => (
              <View
                key={v}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: yFor(v),
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
              />
            ))}

            {/* Line segments */}
            {segments.map((seg, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: seg.cx - seg.len / 2,
                  top: seg.cy - 1,
                  width: seg.len,
                  height: 2,
                  backgroundColor: seg.color,
                  borderRadius: 1,
                  opacity: 0.85,
                  transform: [{ rotate: `${seg.angle}deg` }],
                }}
              />
            ))}

            {/* Dots at every valid point */}
            {points.map((p, i) => {
              if (!p) return null;
              const isToday = i === n - 1;
              return (
                <View
                  key={p.date}
                  style={{
                    position: 'absolute',
                    left: p.x - (isToday ? DOT_R + 2 : DOT_R),
                    top: p.y - (isToday ? DOT_R + 2 : DOT_R),
                    width: isToday ? (DOT_R + 2) * 2 : DOT_R * 2,
                    height: isToday ? (DOT_R + 2) * 2 : DOT_R * 2,
                    borderRadius: isToday ? DOT_R + 2 : DOT_R,
                    backgroundColor: isToday ? MOOD_COLORS[p.v] : 'rgba(255,255,255,0.25)',
                    borderWidth: isToday ? 2 : 0,
                    borderColor: isToday ? Colors.warmWhite : undefined,
                  }}
                />
              );
            })}

            {/* Y-axis labels */}
            <Text style={[styles.axisLabel, { position: 'absolute', right: 0, top: yFor(5) - 8 }]}>Great</Text>
            <Text style={[styles.axisLabel, { position: 'absolute', right: 0, top: yFor(3) - 8 }]}>Okay</Text>
            <Text style={[styles.axisLabel, { position: 'absolute', right: 0, top: yFor(1) - 8 }]}>Low</Text>
          </>
        )}
      </View>

      {/* X-axis day labels */}
      <View style={styles.xAxis}>
        {data.map((d, i) => {
          const isToday = i === n - 1;
          const dayIdx = new Date(d.date + 'T12:00:00').getDay();
          return (
            <Text
              key={d.date}
              style={[styles.xLabel, isToday && styles.xLabelToday]}
            >
              {isToday ? 'Now' : DAY_LABELS[dayIdx].slice(0, 1)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function MoodInsightCard({ todayCheckIn, recentCheckIns, onPress }: MoodInsightCardProps) {
  const chartData = buildChartData(recentCheckIns);

  const moodScore = todayCheckIn?.moodScore ?? null;
  const moodColor = moodScore ? MOOD_COLORS[moodScore] : Colors.textMuted;
  const moodLabel = moodScore ? MOOD_LABELS[moodScore] : null;
  const headline = moodScore ? HEADLINES[moodScore] : 'No check-in yet today';
  const body = moodScore ? BODY_COPY[moodScore] : 'Start a daily check-in to see your mood trend here.';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress ?? (() => router.push('/checkin'))}
      activeOpacity={0.75}
      accessibilityLabel="Today's mood insight"
      accessibilityRole="button"
    >
      {/* ── Header row ── */}
      <View style={styles.header}>
        <Ionicons name="happy-outline" size={22} color={Colors.textMuted} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Today's Mood</Text>
          {moodLabel && (
            <Text style={[styles.statusTag, { color: moodColor }]}>
              {'FEELING ' + moodLabel.toUpperCase()}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Display headline ── */}
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.body}>{body}</Text>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Line chart ── */}
      <MoodLineChart data={chartData} />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // display text
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // chart axes
  axisLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    width: 20,
  },
  xLabelToday: {
    color: Colors.safeBlue,
    fontWeight: '700',
  },
});

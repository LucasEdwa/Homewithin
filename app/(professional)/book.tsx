import { Colors } from '@/constants/Colors';
import { SESSION_DURATION_MINUTES } from '@/constants/ProfessionalSupport';
import { Radius, Spacing } from '@/constants/Spacing';
import { getProfessional } from '@/services/professional/directory';
import { getOpenSlots } from '@/services/professional/availability';
import { type OpenSlot, type ProfessionalProfile } from '@/types/professional';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  return `${DAY_LABELS[d.getDay()]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
}

/** Groups open slots by calendar date (YYYY-MM-DD). */
function groupByDay(slots: OpenSlot[]): Map<string, OpenSlot[]> {
  const map = new Map<string, OpenSlot[]>();
  for (const slot of slots) {
    const key = slot.startsAt.slice(0, 10);
    const existing = map.get(key) ?? [];
    existing.push(slot);
    map.set(key, existing);
  }
  return map;
}

/** Returns the Monday date of the week containing `date`. */
function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [slots, setSlots] = useState<OpenSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week

  useEffect(() => {
    if (!id) return;
    Promise.all([getProfessional(id), getOpenSlots(id, 4)])
      .then(([prof, openSlots]) => {
        setProfessional(prof);
        setSlots(openSlots);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const byDay = useMemo(() => groupByDay(slots), [slots]);

  /** ISO date strings (Mon–Sun) for the currently displayed week. */
  const weekDays = useMemo((): string[] => {
    const base = weekStart(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = new Date(weekDays[0]);
    const end = new Date(weekDays[6]);
    return `${start.getDate()} ${MONTH_LABELS[start.getMonth()]} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()]}`;
  }, [weekDays]);

  const canGoPrev = weekOffset > 0;

  const handleSlotPress = useCallback(
    (slot: OpenSlot) => {
      const params = new URLSearchParams({
        professionalId: slot.professionalId,
        scheduledAt: slot.startsAt,
      });
      router.push(`/(professional)/checkout-summary?${params.toString()}` as never);
    },
    [],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.safeBlue} style={{ marginTop: Spacing.xl }} />
      </SafeAreaView>
    );
  }

  if (error || !professional) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.errorText}>{error ?? 'Could not load availability.'}</Text>
      </SafeAreaView>
    );
  }

  const daysWithSlots = weekDays.filter((day) => (byDay.get(day)?.length ?? 0) > 0);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Choose a Time</Text>
          <Text style={styles.headerSub}>{professional.displayName}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Session info bar */}
      <View style={styles.infoBar}>
        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.infoText}>{SESSION_DURATION_MINUTES} min session</Text>
        <Text style={styles.infoDot}>·</Text>
        <Text style={styles.infoText}>
          {(professional.sessionPriceSekOre / 100).toFixed(0)} SEK
        </Text>
      </View>

      {/* Week navigator */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => setWeekOffset((o) => Math.max(0, o - 1))}
          disabled={!canGoPrev}
          style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={canGoPrev ? Colors.textPrimary : Colors.textMuted}
          />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity
          onPress={() => setWeekOffset((o) => o + 1)}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {daysWithSlots.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No slots available this week</Text>
            <Text style={styles.emptyHint}>Try the next week →</Text>
          </View>
        ) : (
          daysWithSlots.map((day) => {
            const daySlots = byDay.get(day) ?? [];
            return (
              <View key={day} style={styles.dayGroup}>
                <Text style={styles.dayLabel}>{formatDateHeader(day)}</Text>
                <View style={styles.slotGrid}>
                  {daySlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.startsAt}
                      style={styles.slotBtn}
                      onPress={() => handleSlotPress(slot)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.slotTime}>{formatTime(slot.startsAt)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  backBtn: { width: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  // Info bar
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingBottom: Spacing.sm,
  },
  infoText: { fontSize: 13, color: Colors.textMuted },
  infoDot: { fontSize: 13, color: Colors.textMuted },
  // Week navigator
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  weekLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  // Scroll content
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 48 },
  // Empty state
  emptyBox: { alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.sm },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emptyHint: { fontSize: 13, color: Colors.textMuted },
  // Day group
  dayGroup: { gap: Spacing.sm },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotTime: { fontSize: 15, fontWeight: '600', color: Colors.softGreen },
  // Error
  errorText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
  },
});

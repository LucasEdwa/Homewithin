import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { MoodInsightCard } from '@/components/ui/MoodInsightCard';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { useCheckIns } from '@/hooks/useCheckIns';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const SAFETY_COLORS: Record<string, string> = {
  green: Colors.safetyGreen,
  yellow: Colors.safetyYellow,
  red: Colors.alertRed,
};
const SAFETY_LABELS: Record<string, string> = {
  green: 'Safe',
  yellow: 'Some concern',
  red: 'Reach out now',
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile, safetyLevel } = useSession();
  const { todayCheckIn, recentCheckIns } = useCheckIns();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const name = profile?.nickname ?? 'Friend';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayLabel = new Date().toLocaleDateString('en-SE', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <Text style={styles.greeting}>
            {greeting},{'\n'}{name}
          </Text>
          {safetyLevel && (
            <View style={[styles.safetyPill, { borderColor: SAFETY_COLORS[safetyLevel] + '60' }]}>
              <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS[safetyLevel] }]} />
              <Text style={[styles.safetyPillText, { color: SAFETY_COLORS[safetyLevel] }]}>
                {SAFETY_LABELS[safetyLevel]}
              </Text>
            </View>
          )}
        </View>

        {/* ── Today's state (hero) ─────────────────────────── */}
        <SectionLabel label="Today" />
        <MoodInsightCard
          todayCheckIn={todayCheckIn}
          recentCheckIns={recentCheckIns}
        />

        {/* ── Daily practice ───────────────────────────────── */}
        <SectionLabel label="Daily practice" />
        <GroupedCard>
          <OuraRow
            icon="pulse-outline"
            iconColor={Colors.textMuted}
            title="Daily Check-in"
            subtitle="Track your mood and feelings"
            onPress={() => router.push('/checkin')}
          />
          <OuraRow
            icon="book-outline"
            iconColor={Colors.textMuted}
            title="Journal"
            subtitle="Your private space to express"
            onPress={() => router.push('/journal-entry')}
            divider
          />
          <OuraRow
            icon="bar-chart-outline"
            iconColor={Colors.textMuted}
            title="My Progress"
            subtitle="Streaks, milestones, mood trends"
            onPress={() => router.push('/progress')}
            divider
          />
        </GroupedCard>

        {/* ── Safety & support ─────────────────────────────── */}
        <SectionLabel label="Safety & support" />
        <GroupedCard>
          <OuraRow
            icon="shield-checkmark-outline"
            iconColor={Colors.textMuted}
            title="Safety Assessment"
            subtitle={safetyLevel ? `Status — ${SAFETY_LABELS[safetyLevel].toUpperCase()}` : 'Check in on your safety'}
            subtitleColor={safetyLevel ? SAFETY_COLORS[safetyLevel] : undefined}
            onPress={() => router.push('/safety')}
          />
          <OuraRow
            icon="sparkles-outline"
            iconColor={Colors.textMuted}
            title="AI Companion"
            subtitle="Talk through what's on your mind"
            onPress={() => router.push('/ai-companion')}
            divider
          />
          <OuraRow
            icon="location-outline"
            iconColor={Colors.textMuted}
            title="Local Resources"
            subtitle="LGBTQ+ centers, shelters, legal aid"
            onPress={() => router.push('/local-resources')}
            divider
          />
        </GroupedCard>

        {/* ── Community ────────────────────────────────────── */}
        <SectionLabel label="Community" />
        <GroupedCard>
          <OuraRow
            icon="people-outline"
            iconColor={Colors.textMuted}
            title="Support Matches"
            subtitle="Find people who understand"
            onPress={() => router.push('/(tabs)/connect')}
          />
          <OuraRow
            icon="git-network-outline"
            iconColor={Colors.textMuted}
            title="Chosen Family"
            subtitle="Map your support network"
            onPress={() => router.push('/chosen-family')}
            divider
          />
          <OuraRow
            icon="calendar-outline"
            iconColor={Colors.textMuted}
            title="Events & Circles"
            subtitle="Workshops, meetups, online circles"
            onPress={() => router.push('/events')}
            divider
          />
        </GroupedCard>

        {/* ── Growth ───────────────────────────────────────── */}
        <SectionLabel label="Growth" />
        <GroupedCard>
          <OuraRow
            icon="library-outline"
            iconColor={Colors.textMuted}
            title="Resources"
            subtitle="Guides, articles, and tools"
            onPress={() => router.push('/(tabs)/resources')}
          />
          <OuraRow
            icon="layers-outline"
            iconColor={Colors.textMuted}
            title="Healing Programs"
            subtitle="Structured paths for recovery"
            onPress={() => router.push('/programs')}
            divider
          />
        </GroupedCard>

        {/* ── Affirmation ──────────────────────────────────── */}
        <View style={styles.affirmation}>
          <Text style={styles.affirmationText}>
            "You deserve safety, connection, and belonging — at home, at school, and everywhere you go."
          </Text>
        </View>
      </Animated.ScrollView>

      <EmergencyButton />
    </SafeAreaView>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>;
}

// ─── Grouped card wrapper ─────────────────────────────────────────────────────

function GroupedCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.groupedCard}>{children}</View>;
}

// ─── Oura-style row ───────────────────────────────────────────────────────────

interface OuraRowProps {
  icon: IoniconsName;
  iconColor: string;
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  onPress: () => void;
  divider?: boolean;
}

function OuraRow({ icon, iconColor, title, subtitle, subtitleColor, onPress, divider }: OuraRowProps) {
  return (
    <>
      {divider && <View style={styles.rowDivider} />}
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.65}
        accessibilityLabel={`${title} — ${subtitle}`}
      >
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle && (
            <Text
              style={[
                styles.rowSub,
                subtitleColor ? { color: subtitleColor, fontWeight: '700', letterSpacing: 0.5 } : null,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
      </TouchableOpacity>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 130,
    gap: Spacing.sm,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    paddingBottom: Spacing.sm,
    gap: 6,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 40,
  },
  safetyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: 4,
  },
  safetyDot: { width: 6, height: 6, borderRadius: 3 },
  safetyPillText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // ── Section label ──────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: 4,
    paddingHorizontal: 2,
  },

  // ── Grouped card ──────────────────────────────────────────
  groupedCard: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // ── Oura row ──────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 28 + Spacing.md,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowSub: { fontSize: 12, color: Colors.textSecondary },

  // ── Hero check-in card ─────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
  },
  heroChipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  heroMetric: { flex: 1, gap: 4 },
  heroMetricValue: { fontSize: 22, fontWeight: '300', lineHeight: 26 },
  heroMetricLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  heroMetricTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  heroMetricFill: { height: '100%', borderRadius: 2 },
  heroUpdate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // ── Check-in prompt card ────────────────────────────────────
  promptCard: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  promptInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  promptIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: { flex: 1, gap: 3 },
  promptTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  promptSub: { fontSize: 12, color: Colors.textSecondary },
  promptCta: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  promptCtaText: { fontSize: 13, fontWeight: '700', color: Colors.white },

  // ── Affirmation ────────────────────────────────────────────
  affirmation: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  affirmationText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
});

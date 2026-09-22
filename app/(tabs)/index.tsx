import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { MoodInsightCard } from '@/components/ui/MoodInsightCard';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { useCheckIns } from '@/hooks/useCheckIns';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { profile, safetyLevel } = useSession();
  const { todayCheckIn, recentCheckIns } = useCheckIns();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safetyLabels: Record<string, string> = {
    green: t('home.safety.safe'),
    yellow: t('home.safety.someConcern'),
    red: t('home.safety.reachOutNow'),
  };

  const name = profile?.nickname ?? t('common.friend');
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t('home.greeting.morning') : hour < 17 ? t('home.greeting.afternoon') : t('home.greeting.evening');
  const locale = i18n.language === 'sv' ? 'sv-SE' : 'en-SE';
  const dayLabel = new Date().toLocaleDateString(locale, {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <Text style={styles.greetingTop}>{greeting},</Text>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingName}>{name}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
              accessibilityLabel={t('home.goToProfile')}
            >
              {profile?.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatarImg}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {profile?.nickname?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {safetyLevel && (
            <View style={[styles.safetyPill, { borderColor: SAFETY_COLORS[safetyLevel] + '60' }]}>
              <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS[safetyLevel] }]} />
              <Text style={[styles.safetyPillText, { color: SAFETY_COLORS[safetyLevel] }]}>
                {safetyLabels[safetyLevel]}
              </Text>
            </View>
          )}
        </View>

        {/* ── Today's state (hero) ─────────────────────────── */}
        <SectionLabel label={t('home.sections.today')} />
        <MoodInsightCard
          todayCheckIn={todayCheckIn}
          recentCheckIns={recentCheckIns}
        />

        {/* ── Daily practice ───────────────────────────────── */}
        <SectionLabel label={t('home.sections.dailyPractice')} />
        <GroupedCard>
          <OuraRow
            icon="pulse-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.dailyCheckIn.title')}
            subtitle={t('home.rows.dailyCheckIn.subtitle')}
            onPress={() => router.push('/checkin')}
          />
          <OuraRow
            icon="book-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.journal.title')}
            subtitle={t('home.rows.journal.subtitle')}
            onPress={() => router.push('/journal-entry')}
            divider
          />
          <OuraRow
            icon="bar-chart-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.myProgress.title')}
            subtitle={t('home.rows.myProgress.subtitle')}
            onPress={() => router.push('/progress')}
            divider
          />
        </GroupedCard>

        {/* ── Safety & support ─────────────────────────────── */}
        <SectionLabel label={t('home.sections.safetySupport')} />
        <GroupedCard>
          <OuraRow
            icon="shield-checkmark-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.safetyAssessment.title')}
            subtitle={
              safetyLevel
                ? `${t('home.rows.safetyAssessment.statusPrefix')}${safetyLabels[safetyLevel].toUpperCase()}`
                : t('home.rows.safetyAssessment.subtitle')
            }
            subtitleColor={safetyLevel ? SAFETY_COLORS[safetyLevel] : undefined}
            onPress={() => router.push('/safety')}
          />
          <OuraRow
            icon="sparkles-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.aiCompanion.title')}
            subtitle={t('home.rows.aiCompanion.subtitle')}
            onPress={() => router.push('/ai-companion')}
            divider
          />
          <OuraRow
            icon="location-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.localResources.title')}
            subtitle={t('home.rows.localResources.subtitle')}
            onPress={() => router.push('/local-resources')}
            divider
          />
        </GroupedCard>

        {/* ── Community ────────────────────────────────────── */}
        <SectionLabel label={t('home.sections.community')} />
        <GroupedCard>
          <OuraRow
            icon="people-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.supportMatches.title')}
            subtitle={t('home.rows.supportMatches.subtitle')}
            onPress={() => router.push('/(tabs)/connect')}
          />
          <OuraRow
            icon="git-network-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.chosenFamily.title')}
            subtitle={t('home.rows.chosenFamily.subtitle')}
            onPress={() => router.push('/chosen-family')}
            divider
          />
          <OuraRow
            icon="calendar-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.eventsCircles.title')}
            subtitle={t('home.rows.eventsCircles.subtitle')}
            onPress={() => router.push('/events')}
            divider
          />
        </GroupedCard>

        {/* ── Growth ───────────────────────────────────────── */}
        <SectionLabel label={t('home.sections.growth')} />
        <GroupedCard>
          <OuraRow
            icon="library-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.resources.title')}
            subtitle={t('home.rows.resources.subtitle')}
            onPress={() => router.push('/(tabs)/resources')}
          />
          <OuraRow
            icon="layers-outline"
            iconColor={Colors.textMuted}
            title={t('home.rows.healingPrograms.title')}
            subtitle={t('home.rows.healingPrograms.subtitle')}
            onPress={() => router.push('/programs')}
            divider
          />
        </GroupedCard>

        {/* ── Affirmation ──────────────────────────────────── */}
        <View style={styles.affirmation}>
          <Text style={styles.affirmationText}>{t('home.affirmation')}</Text>
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
    gap: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greetingTop: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 40,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 40,
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
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

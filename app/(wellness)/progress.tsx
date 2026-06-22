import { ArcGauge } from '@/components/ui/ArcGauge';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { useProgress } from '@/hooks/useProgress';
import type { MoodDataPoint } from '@/types';
import { MOOD_COLORS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const MOOD_BAR_MAX = 80;

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { profile } = useSession();
  const { snapshot, loading } = useProgress();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading && snapshot) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, snapshot]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('progress.title')}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.safeBlue} />
        </View>
      ) : !snapshot ? (
        <View style={styles.centered} testID="error-state">
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>{t('progress.loadError')}</Text>
          <Text style={styles.errorHint}>{t('progress.loadErrorHint')}</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
        >
          <Card style={styles.gaugeCard}>
            <ArcGauge
              value={snapshot.lessonsCompleted}
              max={snapshot.totalLessons}
              label={t('progress.lessonsLabel')}
              icon="layers-outline"
              color={Colors.softGreen}
            />
          </Card>

          <ProfileBadge
            completion={snapshot.profileCompletion}
            onboardingBadge={snapshot.onboardingBadge}
            nickname={profile?.nickname}
          />

          <View style={styles.statRow}>
            <StatCard
              testID="stat-streak"
              icon="flame-outline"
              color="#E8844E"
              value={String(snapshot.journalStreak)}
              label={t('progress.dayStreak')}
              sublabel="Journal"
              empty={snapshot.journalStreak === 0}
              emptyMsg={t('progress.startStreak')}
            />
            <StatCard
              testID="stat-connections"
              icon="people-outline"
              color={Colors.safeBlue}
              value={String(snapshot.connectionsCount)}
              label={snapshot.connectionsCount === 1 ? t('progress.connections', { count: 1 }) : t('progress.connections_plural', { count: snapshot.connectionsCount })}
              sublabel={t('progress.connectionsMade')}
            />
          </View>

          <View style={styles.statRow}>
            <StatCard
              testID="stat-lessons"
              icon="checkmark-circle-outline"
              color={Colors.softGreen}
              value={`${snapshot.lessonsCompleted}/${snapshot.totalLessons}`}
              label={t('progress.lessons')}
              sublabel={t('progress.programsSublabel')}
              empty={snapshot.lessonsCompleted === 0}
              emptyMsg={t('progress.startProgram')}
            />
            <SafetyCard delta={snapshot.safetyDelta} />
          </View>

          <Card style={styles.moodCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="bar-chart-outline" size={18} color={Colors.mutedLavender} />
              <Text style={styles.cardTitle}>{t('progress.moodTitle')}</Text>
            </View>
            {snapshot.moodTrend.length === 0 ? (
              <View style={styles.emptyCard} testID="mood-empty">
                <Text style={styles.emptyCardText}>{t('progress.moodEmpty')}</Text>
              </View>
            ) : (
              <MoodTrendChart data={snapshot.moodTrend} />
            )}
          </Card>

          <Card style={styles.linksCard}>
            <Text style={styles.cardTitle}>{t('progress.keepGoing')}</Text>
            <QuickLink
              testID="link-checkin"
              icon="happy-outline"
              color={Colors.safeBlue}
              label={t('progress.goDailyCheckIn')}
              onPress={() => router.push('/checkin')}
            />
            <QuickLink
              testID="link-journal"
              icon="book-outline"
              color={Colors.mutedLavender}
              label={t('progress.goJournal')}
              onPress={() => router.push('/journal-entry')}
            />
            <QuickLink
              testID="link-programs"
              icon="layers-outline"
              color={Colors.softGreen}
              label={t('progress.goPrograms')}
              onPress={() => router.push('/programs')}
            />
          </Card>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

function ProfileBadge({
  completion,
  onboardingBadge,
  nickname,
}: {
  completion: number;
  onboardingBadge: boolean;
  nickname?: string;
}) {
  const { t } = useTranslation();
  const color =
    completion >= 100
      ? Colors.softGreen
      : completion >= 60
      ? Colors.safeBlue
      : Colors.mutedLavender;

  return (
    <Card style={styles.badgeCard} testID="profile-badge">
      <View style={styles.badgeRow}>
        <View style={[styles.badgeCircle, { borderColor: color }]}>
          <Text style={[styles.badgePct, { color }]}>{completion}%</Text>
          <Text style={styles.badgeLabel}>{t('progress.profileLabel')}</Text>
        </View>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeName}>{nickname ?? t('progress.profileLabel')}</Text>
          <Text style={styles.badgeDesc}>
            {completion === 100
              ? t('progress.profileComplete')
              : t('progress.profileIncomplete', { pct: 100 - completion })}
          </Text>
          {onboardingBadge && (
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color={Colors.softGreen} />
              <Text style={styles.badgeText}>{t('progress.profileBadge')}</Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={styles.progressTrack}
        accessibilityLabel={`${t('progress.profileLabel')} ${completion}%`}
        accessibilityRole="progressbar"
      >
        <View style={[styles.progressFill, { width: `${completion}%`, backgroundColor: color }]} />
      </View>
    </Card>
  );
}

function StatCard({
  testID,
  icon,
  color,
  value,
  label,
  sublabel,
  empty,
  emptyMsg,
}: {
  testID: string;
  icon: IoniconsName;
  color: string;
  value: string;
  label: string;
  sublabel: string;
  empty?: boolean;
  emptyMsg?: string;
}) {
  return (
    <Card style={styles.statCard} testID={testID}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.sublabel}>{sublabel}</Text>
      {empty ? (
        <Text style={styles.emptyStatText}>{emptyMsg}</Text>
      ) : (
        <>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </>
      )}
    </Card>
  );
}

function SafetyCard({ delta }: { delta: number | null }) {
  const { t } = useTranslation();

  if (delta === null) {
    return (
      <Card style={styles.statCard} testID="stat-safety">
        <View style={styles.statIcon}>
          <Ionicons name="shield-outline" size={24} color={Colors.alertRed} />
        </View>
        <Text style={styles.sublabel}>{t('progress.safetySublabel')}</Text>
        <Text style={styles.emptyStatText}>{t('progress.safetyNeeds')}</Text>
      </Card>
    );
  }

  const improved = delta > 0;
  const neutral = delta === 0;
  const color = improved
    ? Colors.softGreen
    : neutral
    ? Colors.textMuted
    : Colors.alertRed;
  const icon: IoniconsName = improved
    ? 'trending-up-outline'
    : neutral
    ? 'remove-outline'
    : 'trending-down-outline';

  return (
    <Card style={styles.statCard} testID="stat-safety">
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.sublabel}>{t('progress.safetySublabel')}</Text>
      <Text style={[styles.statValue, { color }]}>
        {delta > 0 ? '+' : ''}{delta}
      </Text>
      <Text style={styles.statLabel}>{t('progress.vsLastWeek')}</Text>
    </Card>
  );
}

function MoodTrendChart({ data }: { data: MoodDataPoint[] }) {
  const { t } = useTranslation();
  const last = data.slice(-14);
  return (
    <View style={styles.moodBars} testID="mood-chart">
      {last.map((point, i) => {
        const barH = Math.max(4, (point.mood / 5) * MOOD_BAR_MAX);
        const color = MOOD_COLORS[point.mood as 1 | 2 | 3 | 4 | 5] ?? Colors.softGray;
        const isLast = i === last.length - 1;
        return (
          <View key={point.date} style={styles.moodBarCol}>
            <View style={styles.moodBarTrack}>
              <View style={[styles.moodBar, { height: barH, backgroundColor: color }]} />
            </View>
            {isLast && <Text style={styles.todayLabel}>{t('progress.today')}</Text>}
          </View>
        );
      })}
    </View>
  );
}

function QuickLink({
  testID,
  icon,
  color,
  label,
  onPress,
}: {
  testID: string;
  icon: IoniconsName;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      style={styles.quickLink}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  errorText: { fontSize: 17, fontWeight: '600', color: Colors.textSecondary },
  errorHint: { fontSize: 14, color: Colors.textMuted },

  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },

  gaugeCard: { paddingBottom: Spacing.lg },

  badgeCard: { gap: Spacing.sm },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePct: { fontSize: 18, fontWeight: '800' },
  badgeLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  badgeInfo: { flex: 1, gap: 4 },
  badgeName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  badgeDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.softGreen + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.softGreen },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full },

  statRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, gap: 4, alignItems: 'flex-start' },
  statIcon: {
    marginBottom: 4,
  },
  sublabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  statLabel: { fontSize: 13, color: Colors.textSecondary },
  emptyStatText: { fontSize: 12, color: Colors.textMuted, lineHeight: 16, marginTop: 2 },

  moodCard: { gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  emptyCard: { paddingVertical: Spacing.md, alignItems: 'center' },
  emptyCardText: { fontSize: 14, color: Colors.textMuted },
  moodBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: MOOD_BAR_MAX + 20,
  },
  moodBarCol: { flex: 1, alignItems: 'center', gap: 4 },
  moodBarTrack: { width: '100%', height: MOOD_BAR_MAX, justifyContent: 'flex-end', alignItems: 'center' },
  moodBar: { width: '80%', borderRadius: Radius.sm, minHeight: 4 },
  todayLabel: { fontSize: 8, color: Colors.safeBlue, fontWeight: '700' },

  linksCard: { gap: Spacing.xs },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
});

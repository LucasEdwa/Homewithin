import { EmergencyButton } from '@/components/EmergencyButton';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { getTodayCheckIn } from '@/services/storage';
import type { CheckIn } from '@/types';
import { EMOTION_COLORS, MOOD_COLORS, MOOD_ICONS, MOOD_LABELS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import {
    Animated,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const SAFETY_COLORS: Record<string, string> = {
  green: Colors.safetyGreen,
  yellow: Colors.safetyYellow,
  red: Colors.alertRed,
};
const SAFETY_LABELS: Record<string, string> = {
  green: 'You seem safe',
  yellow: 'Some support may help',
  red: 'Reach out now',
};

interface DashCardProps {
  icon: IoniconsName;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}

export default function HomeScreen() {
  const { profile, safetyLevel } = useSession();
  const [todayCheckIn, setTodayCheckIn] = React.useState<CheckIn | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const name = profile?.nickname ?? 'Friend';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useFocusEffect(
    useCallback(() => {
      getTodayCheckIn().then(setTodayCheckIn);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {name}</Text>
            <Text style={styles.subGreeting}>How are you feeling today?</Text>
          </View>
          {safetyLevel && (
            <View style={[styles.safetyBadge, { backgroundColor: SAFETY_COLORS[safetyLevel] + '20', borderColor: SAFETY_COLORS[safetyLevel] }]}>
              <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS[safetyLevel] }]} />
              <Text style={[styles.safetyLabel, { color: SAFETY_COLORS[safetyLevel] }]}>
                {SAFETY_LABELS[safetyLevel]}
              </Text>
            </View>
          )}
        </View>

        {/* Feeling summary or check-in prompt */}
        {todayCheckIn ? (
          <FeelingSummaryCard checkIn={todayCheckIn} safetyLevel={safetyLevel ?? undefined} />
        ) : (
          <CheckInPromptCard safetyLevel={safetyLevel ?? undefined} />
        )}

        {/* Category: Daily practice */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Daily practice</Text>
          <View style={styles.sectionCards}>
            <DashCard icon="happy-outline"       title="Daily Check-in"   description="Track your mood and feelings"    color={Colors.safeBlue}      onPress={() => router.push('/checkin')} />
            <DashCard icon="book-outline"        title="Journal"          description="Your private space to express"   color={Colors.mutedLavender} onPress={() => router.push('/journal-entry')} />
            <DashCard icon="trending-up-outline" title="My Progress"      description="Streaks, milestones, mood trends" color={Colors.softGreen}     onPress={() => router.push('/progress')} />
          </View>
        </View>

        {/* Category: Safety & support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Safety & support</Text>
          <View style={styles.sectionCards}>
            <DashCard icon="shield-checkmark-outline" title="Safety Assessment" description="Check in on your safety"         color={Colors.alertRed}      onPress={() => router.push('/safety')} />
            <DashCard icon="sparkles-outline"         title="AI Companion"      description="Talk through what's on your mind" color={Colors.mutedLavender} onPress={() => router.push('/ai-companion')} />
            <DashCard icon="map-outline"              title="Local Resources"   description="LGBTQ+ centers, shelters, legal aid" color={Colors.softGreen}  onPress={() => router.push('/local-resources')} />
          </View>
        </View>

        {/* Category: Community */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Community</Text>
          <View style={styles.sectionCards}>
            <DashCard icon="people-outline"      title="Support Matches" description="Find people who understand"      color={Colors.softGreen}     onPress={() => router.push('/(tabs)/connect')} />
            <DashCard icon="git-network-outline" title="Chosen Family"   description="Map your support network"       color="#E8844E"              onPress={() => router.push('/chosen-family')} />
            <DashCard icon="calendar-outline"    title="Events & Circles" description="Workshops, meetups, online circles" color="#E8844E"           onPress={() => router.push('/events')} />
          </View>
        </View>

        {/* Category: Growth */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Growth</Text>
          <View style={styles.sectionCards}>
            <DashCard icon="library-outline" title="Resources"        description="Guides, articles, and tools"   color={Colors.safeBlue}  onPress={() => router.push('/(tabs)/resources')} />
            <DashCard icon="layers-outline"  title="Healing Programs" description="Structured paths for recovery" color="#B8A8E3"           onPress={() => router.push('/programs')} />
          </View>
        </View>

        <Card style={styles.affirmation}>
          <Text style={styles.affirmationText}>
            "You deserve safety, connection, and belonging — at home, at school, and everywhere you go."
          </Text>
        </Card>
      </Animated.ScrollView>

      <EmergencyButton />
    </SafeAreaView>
  );
}

// ─── Feeling summary card (shown when check-in data exists) ──────────────────

interface FeelingSummaryCardProps {
  checkIn: CheckIn;
  safetyLevel?: string;
}

function FeelingSummaryCard({ checkIn, safetyLevel }: FeelingSummaryCardProps) {
  const moodColor = MOOD_COLORS[checkIn.moodScore];
  const safetyColor = safetyLevel ? SAFETY_COLORS[safetyLevel] : undefined;

  return (
    <TouchableOpacity
      style={[styles.summaryCard, { borderLeftColor: moodColor }]}
      onPress={() => router.push('/checkin')}
      activeOpacity={0.85}
    >
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Today's wellbeing</Text>
        <View style={styles.summaryUpdateBtn}>
          <Text style={[styles.summaryUpdateText, { color: moodColor }]}>Update</Text>
          <Ionicons name="pencil-outline" size={12} color={moodColor} />
        </View>
      </View>

      {/* Mood row */}
      <View style={styles.summaryMoodRow}>
        <View style={[styles.summaryMoodIcon, { backgroundColor: moodColor + '18' }]}>
          <Ionicons name={MOOD_ICONS[checkIn.moodScore]} size={26} color={moodColor} />
        </View>
        <View style={styles.summaryMoodText}>
          <Text style={[styles.summaryMoodLabel, { color: moodColor }]}>
            {MOOD_LABELS[checkIn.moodScore]}
          </Text>
          <Text style={styles.summaryMoodScore}>{checkIn.moodScore}/5 mood</Text>
        </View>
        {safetyLevel && safetyColor && (
          <View style={[styles.safetyCapsule, { backgroundColor: safetyColor + '18', borderColor: safetyColor }]}>
            <View style={[styles.safetyDot, { backgroundColor: safetyColor }]} />
            <Text style={[styles.safetyCapsuleText, { color: safetyColor }]}>
              {SAFETY_LABELS[safetyLevel]}
            </Text>
          </View>
        )}
      </View>

      {/* Sub-scores */}
      <View style={styles.summaryScores}>
        <ScorePill label="Anxiety" value={checkIn.anxietyScore} color={Colors.alertRed} />
        <ScorePill label="Lonely" value={checkIn.lonelinessScore} color={Colors.mutedLavender} />
        <ScorePill label="Safety" value={checkIn.safetyScore} color={Colors.softGreen} invert />
      </View>

      {/* Emotion tags */}
      {checkIn.tags.length > 0 && (
        <View style={styles.summaryTags}>
          {checkIn.tags.map((tag) => (
            <View key={tag} style={[styles.summaryTag, { backgroundColor: (EMOTION_COLORS as any)[tag] + '18' ?? Colors.border }]}>
              <Text style={[styles.summaryTagText, { color: (EMOTION_COLORS as any)[tag] ?? Colors.textMuted }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Hardest thing */}
      {checkIn.hardestThing?.trim() ? (
        <Text style={styles.summaryHardest} numberOfLines={1}>
          "{checkIn.hardestThing}"
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

interface ScorePillProps {
  label: string;
  value: number;
  color: string;
  invert?: boolean;
}

function ScorePill({ label, value, color, invert }: ScorePillProps) {
  const filled = invert ? value : 11 - value;
  const fillColor = invert
    ? value >= 7 ? Colors.softGreen : value >= 4 ? '#E8C44E' : Colors.alertRed
    : value <= 3 ? Colors.softGreen : value <= 6 ? '#E8C44E' : Colors.alertRed;
  return (
    <View style={styles.scorePill}>
      <Text style={styles.scorePillLabel}>{label}</Text>
      <View style={styles.scorePillBar}>
        <View style={[styles.scorePillFill, { width: `${(value / 10) * 100}%` as any, backgroundColor: fillColor }]} />
      </View>
      <Text style={[styles.scorePillValue, { color: fillColor }]}>{value}</Text>
    </View>
  );
}

// ─── Prompt card (shown when no check-in yet today) ──────────────────────────

function CheckInPromptCard({ safetyLevel }: { safetyLevel?: string }) {
  const safetyColor = safetyLevel ? SAFETY_COLORS[safetyLevel] : undefined;

  return (
    <TouchableOpacity
      style={styles.promptCard}
      onPress={() => router.push('/checkin')}
      activeOpacity={0.85}
    >
      <View style={styles.promptLeft}>
        <View style={styles.promptIconBg}>
          <Ionicons name="pulse-outline" size={22} color={Colors.safeBlue} />
        </View>
        <View style={styles.promptText}>
          <Text style={styles.promptTitle}>How are you feeling today?</Text>
          <Text style={styles.promptSub}>Your daily check-in takes 30 seconds.</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.safeBlue} />
      {safetyLevel && safetyColor && (
        <View style={[styles.safetyCapsule, { backgroundColor: safetyColor + '18', borderColor: safetyColor, position: 'absolute', top: 8, right: 36 }]}>
          <View style={[styles.safetyDot, { backgroundColor: safetyColor }]} />
          <Text style={[styles.safetyCapsuleText, { color: safetyColor }]}>{SAFETY_LABELS[safetyLevel]}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function DashCard({ icon, title, description, color, onPress }: DashCardProps) {
  return (
    <TouchableOpacity
      style={styles.dashCard}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`${title} — ${description}`}
    >
      <View style={[styles.dashIconBg, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.dashText}>
        <Text style={styles.dashTitle}>{title}</Text>
        <Text style={styles.dashDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  header: { gap: Spacing.sm },
  greeting: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  subGreeting: { fontSize: 15, color: Colors.textSecondary },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  safetyDot: { width: 8, height: 8, borderRadius: 4 },
  safetyLabel: { fontSize: 13, fontWeight: '600' },

  // ─── Feeling summary card ────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderLeftWidth: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' },
  summaryUpdateBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  summaryUpdateText: { fontSize: 13, fontWeight: '600' },
  summaryMoodRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  summaryMoodIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  summaryMoodText: { flex: 1, gap: 1 },
  summaryMoodLabel: { fontSize: 20, fontWeight: '700' },
  summaryMoodScore: { fontSize: 13, color: Colors.textMuted },
  safetyCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  safetyCapsuleText: { fontSize: 11, fontWeight: '600' },
  summaryScores: { flexDirection: 'row', gap: Spacing.sm },
  scorePill: { flex: 1, gap: 3 },
  scorePillLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  scorePillBar: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scorePillFill: { height: '100%', borderRadius: 3 },
  scorePillValue: { fontSize: 12, fontWeight: '700' },
  summaryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  summaryTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  summaryTagText: { fontSize: 12, fontWeight: '600' },
  summaryHardest: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // ─── Check-in prompt card ────────────────────────────────────────────────────
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.safeBlue + '40',
    shadowColor: Colors.safeBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  promptLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  promptIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.safeBlue + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: { flex: 1, gap: 2 },
  promptTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  promptSub: { fontSize: 13, color: Colors.textMuted },

  // ─── Category sections ───────────────────────────────────────────────────────
  section: { gap: Spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
  sectionCards: { gap: Spacing.xs },

  // ─── Dash card ───────────────────────────────────────────────────────────────
  dashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dashIconBg: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  dashText: { flex: 1, gap: 2 },
  dashTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  dashDesc: { fontSize: 13, color: Colors.textSecondary },
  affirmation: {
    backgroundColor: Colors.safeBlue + '10',
    borderLeftWidth: 3,
    borderLeftColor: Colors.safeBlue,
  },
  affirmationText: { fontSize: 15, color: Colors.safeBlue, fontStyle: 'italic', lineHeight: 22 },
});

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { EmergencyButton } from '@/components/EmergencyButton';
import { useSession } from '@/context/SessionContext';
import { getTodayCheckIn } from '@/services/storage';
import { MOOD_ICONS, MOOD_COLORS, MOOD_LABELS } from '@/types';
import type { CheckIn } from '@/types';

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

        {/* Today's mood quick status */}
        {todayCheckIn && (
          <TouchableOpacity
            style={styles.moodStrip}
            onPress={() => router.push('/checkin')}
            activeOpacity={0.8}
          >
            <Ionicons name={MOOD_ICONS[todayCheckIn.moodScore]} size={20} color={MOOD_COLORS[todayCheckIn.moodScore]} />
            <Text style={styles.moodStripText}>
              Today: <Text style={{ color: MOOD_COLORS[todayCheckIn.moodScore], fontWeight: '700' }}>{MOOD_LABELS[todayCheckIn.moodScore]}</Text>
            </Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.cards}>
          <DashCard icon="happy-outline"            title="Daily Check-in"     description="Track your mood and feelings"   color={Colors.safeBlue}      onPress={() => router.push('/checkin')} />
          <DashCard icon="book-outline"             title="Write in Journal"   description="Your private space to express"  color={Colors.mutedLavender} onPress={() => router.push('/journal-entry')} />
          <DashCard icon="people-outline"           title="Support Matches"    description="Find people who understand"     color={Colors.softGreen}     onPress={() => router.push('/(tabs)/connect')} />
          <DashCard icon="library-outline"          title="Resources for You"  description="Guides, articles, and tools"    color={Colors.safeBlue}      onPress={() => router.push('/(tabs)/resources')} />
          <DashCard icon="shield-checkmark-outline" title="Safety Assessment"  description="Check in on your safety"        color={Colors.alertRed}      onPress={() => router.push('/safety')} />
          <DashCard icon="layers-outline"           title="Healing Programs"   description="Structured paths for recovery"  color="#B8A8E3"              onPress={() => router.push('/programs')} />
          <DashCard icon="git-network-outline"     title="Chosen Family"      description="Map your support network"       color="#E8844E"              onPress={() => router.push('/chosen-family')} />
          <DashCard icon="sparkles-outline"         title="AI Companion"       description="Talk through what's on your mind" color={Colors.mutedLavender} onPress={() => router.push('/ai-companion')} />
          <DashCard icon="map-outline"              title="Local Resources"    description="LGBTQ+ centers, shelters, legal aid" color={Colors.softGreen}     onPress={() => router.push('/local-resources')} />
          <DashCard icon="calendar-outline"         title="Events & Circles"   description="Workshops, meetups, online circles" color="#E8844E"              onPress={() => router.push('/events')} />
          <DashCard icon="trending-up-outline"      title="My Progress"        description="Streaks, milestones, mood trends"   color={Colors.mutedLavender} onPress={() => router.push('/progress')} />
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
  moodStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  moodStripText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  cards: { gap: Spacing.sm },
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
  dashIconBg: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  dashText: { flex: 1, gap: 2 },
  dashTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  dashDesc: { fontSize: 13, color: Colors.textSecondary },
  affirmation: {
    backgroundColor: Colors.safeBlue + '10',
    borderLeftWidth: 3,
    borderLeftColor: Colors.safeBlue,
  },
  affirmationText: { fontSize: 15, color: Colors.safeBlue, fontStyle: 'italic', lineHeight: 22 },
});

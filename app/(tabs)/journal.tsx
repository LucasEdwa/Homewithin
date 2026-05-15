import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MoodChart } from '@/components/ui/MoodChart';
import { EmergencyButton } from '@/components/EmergencyButton';
import { getTodayCheckIn, getRecentCheckIns, getJournalEntries } from '@/services/storage';
import type { CheckIn, JournalEntry } from '@/types';
import { MOOD_LABELS, MOOD_ICONS, MOOD_COLORS, EMOTION_COLORS } from '@/types';

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export default function JournalScreen() {
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [today, recent, entries] = await Promise.all([
          getTodayCheckIn(),
          getRecentCheckIns(7),
          getJournalEntries(),
        ]);
        setTodayCheckIn(today);
        setRecentCheckIns(recent);
        setRecentEntries(entries.slice(0, 4));
      }
      load();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Journal</Text>

        {/* Quick actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.safeBlue + '18' }]}
            onPress={() => router.push('/checkin')}
            accessibilityLabel="Daily check-in"
          >
            <Ionicons name="happy-outline" size={22} color={Colors.safeBlue} />
            <Text style={[styles.actionLabel, { color: Colors.safeBlue }]}>Check in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.mutedLavender + '18' }]}
            onPress={() => router.push('/journal-entry')}
            accessibilityLabel="New journal entry"
          >
            <Ionicons name="create-outline" size={22} color={Colors.mutedLavender} />
            <Text style={[styles.actionLabel, { color: Colors.mutedLavender }]}>New entry</Text>
          </TouchableOpacity>
        </View>

        {/* Today's check-in */}
        {todayCheckIn ? (
          <Card style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Text style={styles.sectionTitle}>Today's mood</Text>
              <TouchableOpacity onPress={() => router.push('/checkin')}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.todayMood}>
              <Ionicons
                name={MOOD_ICONS[todayCheckIn.moodScore]}
                size={36}
                color={MOOD_COLORS[todayCheckIn.moodScore]}
              />
              <View style={styles.todayMoodText}>
                <Text style={[styles.moodLabel, { color: MOOD_COLORS[todayCheckIn.moodScore] }]}>
                  {MOOD_LABELS[todayCheckIn.moodScore]}
                </Text>
                {todayCheckIn.tags.length > 0 && (
                  <Text style={styles.moodTags}>{todayCheckIn.tags.join(' · ')}</Text>
                )}
              </View>
            </View>
            {todayCheckIn.hardestThing.trim() !== '' && (
              <Text style={styles.hardestThing} numberOfLines={2}>
                "{todayCheckIn.hardestThing}"
              </Text>
            )}
          </Card>
        ) : (
          <TouchableOpacity
            style={styles.checkinCta}
            onPress={() => router.push('/checkin')}
            activeOpacity={0.8}
          >
            <Ionicons name="happy-outline" size={24} color={Colors.safeBlue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.checkinCtaTitle}>How are you feeling today?</Text>
              <Text style={styles.checkinCtaSub}>Tap to check in — takes 1 minute.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* 7-day chart */}
        {recentCheckIns.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Mood — last 7 days</Text>
            <MoodChart checkIns={recentCheckIns} />
          </Card>
        )}

        {/* Recent journal entries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Journal entries</Text>
            <TouchableOpacity onPress={() => router.push('/journal-entry')}>
              <Text style={styles.editLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {recentEntries.length === 0 ? (
            <Card style={styles.emptyEntries}>
              <Text style={styles.emptyText}>No entries yet. Writing is healing.</Text>
              <Button
                label="Write your first entry"
                variant="secondary"
                onPress={() => router.push('/journal-entry')}
              />
            </Card>
          ) : (
            recentEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryRow}
                onPress={() => router.push({ pathname: '/journal-entry', params: { id: entry.id } })}
                activeOpacity={0.75}
              >
                <View style={styles.entryRowLeft}>
                  <Text style={styles.entryRowDate}>{formatDate(entry.date)}</Text>
                  {entry.emotionTags.length > 0 && (
                    <View style={styles.entryRowTags}>
                      {entry.emotionTags.slice(0, 2).map((t) => (
                        <View key={t} style={[styles.miniTag, { backgroundColor: EMOTION_COLORS[t] + '20' }]}>
                          <Text style={[styles.miniTagText, { color: EMOTION_COLORS[t] }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.entryRowPreview} numberOfLines={1}>
                    {entry.isHidden ? '🔒 Hidden entry' : entry.body}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  actions: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  todayCard: { gap: Spacing.sm },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  editLink: { fontSize: 13, color: Colors.safeBlue },
  todayMood: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  todayMoodText: { flex: 1 },
  moodLabel: { fontSize: 18, fontWeight: '700' },
  moodTags: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  hardestThing: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
  checkinCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.safeBlue + '10',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.safeBlue + '30',
  },
  checkinCtaTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  checkinCtaSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyEntries: { gap: Spacing.md, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  entryRowLeft: { flex: 1, gap: 4 },
  entryRowDate: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  entryRowTags: { flexDirection: 'row', gap: 4 },
  miniTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  miniTagText: { fontSize: 10, fontWeight: '600' },
  entryRowPreview: { fontSize: 14, color: Colors.textPrimary },
});

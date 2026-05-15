import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MoodPicker } from '@/components/ui/MoodPicker';
import { MoodChart } from '@/components/ui/MoodChart';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Tag } from '@/components/ui/Tag';
import { EmergencyButton } from '@/components/EmergencyButton';
import { useSession } from '@/context/SessionContext';
import {
  saveCheckIn,
  getTodayCheckIn,
  getRecentCheckIns,
} from '@/services/storage';
import { supabase } from '@/services/supabase';
import type { CheckIn, MoodLevel, TriggerTag } from '@/types';
import { TRIGGER_TAGS } from '@/types';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CheckInScreen() {
  const { setSafetyLevel } = useSession();

  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [anxiety, setAnxiety] = useState(5);
  const [loneliness, setLoneliness] = useState(5);
  const [safetySlider, setSafetySlider] = useState(5);
  const [selectedTags, setSelectedTags] = useState<TriggerTag[]>([]);
  const [hardestThing, setHardestThing] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    async function init() {
      const today = await getTodayCheckIn();
      if (today) {
        setAlreadyCheckedIn(true);
        setMood(today.moodScore);
        setAnxiety(today.anxietyScore);
        setLoneliness(today.lonelinessScore);
        setSafetySlider(today.safetyScore);
        setSelectedTags(today.tags);
        setHardestThing(today.hardestThing);
      }
      const recent = await getRecentCheckIns(7);
      setRecentCheckIns(recent);
    }
    init();
  }, []);

  function toggleTag(tag: TriggerTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    if (!mood) {
      Alert.alert('Select a mood', 'Please pick how you are feeling today.');
      return;
    }
    setLoading(true);

    const entry: CheckIn = {
      id: uuid(),
      date: todayISO(),
      moodScore: mood,
      anxietyScore: anxiety,
      lonelinessScore: loneliness,
      safetyScore: safetySlider,
      hardestThing,
      tags: selectedTags,
      createdAt: new Date().toISOString(),
    };

    await saveCheckIn(entry);

    // Sync to Supabase if available
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (user) {
        const { error } = await supabase.from('check_ins').upsert({
          id: entry.id,
          user_id: user.id,
          date: entry.date,
          mood_score: entry.moodScore,
          anxiety_score: entry.anxietyScore,
          loneliness_score: entry.lonelinessScore,
          safety_score: entry.safetyScore,
          hardest_thing: entry.hardestThing,
          tags: entry.tags,
          created_at: entry.createdAt,
        });
        if (error) console.error('Check-in sync failed:', error.message);
      }
    }

    // Update global safety level from mood
    if (mood >= 4) setSafetyLevel('green');
    else if (mood === 3) setSafetyLevel('yellow');
    else setSafetyLevel('red');

    setAlreadyCheckedIn(true);
    setRecentCheckIns(await getRecentCheckIns(7));
    setLoading(false);

    Alert.alert('Saved', 'Your check-in has been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Check-In</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {alreadyCheckedIn && (
          <Card style={styles.doneBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.softGreen} />
            <Text style={styles.doneText}>You've already checked in today. You can update it below.</Text>
          </Card>
        )}

        {/* Mood */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <MoodPicker value={mood} onChange={setMood} />
        </Card>

        {/* Sliders */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>How are these today?</Text>
          <RangeSlider
            label="Anxiety"
            value={anxiety}
            onValueChange={setAnxiety}
            minLabel="Calm"
            maxLabel="Overwhelmed"
            color="#E8844E"
          />
          <RangeSlider
            label="Loneliness"
            value={loneliness}
            onValueChange={setLoneliness}
            minLabel="Connected"
            maxLabel="Isolated"
            color={Colors.mutedLavender}
          />
          <RangeSlider
            label="Safety"
            value={safetySlider}
            onValueChange={setSafetySlider}
            minLabel="Unsafe"
            maxLabel="Safe"
            color={Colors.softGreen}
          />
        </Card>

        {/* Trigger tags */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>What's affecting you today?</Text>
          <View style={styles.tags}>
            {TRIGGER_TAGS.map((tag) => (
              <Tag
                key={tag}
                label={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>
        </Card>

        {/* Text prompt */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>What has been hardest today?</Text>
          <TextInput
            style={styles.textInput}
            value={hardestThing}
            onChangeText={setHardestThing}
            placeholder="Write anything. This is private."
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
            accessibilityLabel="What has been hardest today"
          />
        </Card>

        {/* 7-day chart */}
        {recentCheckIns.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Your mood — last 7 days</Text>
            <MoodChart checkIns={recentCheckIns} />
          </Card>
        )}

        <Button
          label={alreadyCheckedIn ? 'Update check-in' : 'Save check-in'}
          onPress={handleSave}
          loading={loading}
          style={styles.cta}
        />
      </ScrollView>

      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  headerDate: { fontSize: 13, color: Colors.textMuted },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.softGreen + '15',
    borderLeftWidth: 3,
    borderLeftColor: Colors.softGreen,
  },
  doneText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  textInput: {
    height: 100,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  cta: { marginTop: Spacing.sm },
});

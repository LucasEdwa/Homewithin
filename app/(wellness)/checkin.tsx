import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
import { EmergencyButton } from '@/components/safety/EmergencyButton';
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

export default function CheckInScreen() {
  const { t, i18n } = useTranslation();
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

  const locale = i18n.language === 'sv' ? 'sv-SE' : 'en-US';

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
      prev.includes(tag) ? prev.filter((tt) => tt !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    if (!mood) {
      Alert.alert(t('checkin.alertNoMood'), t('checkin.alertNoMoodBody'));
      return;
    }
    setLoading(true);

    const entry: CheckIn = {
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

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (user) {
        const { error } = await supabase.from('check_ins').upsert({
          user_id: user.id,
          date: entry.date,
          mood_score: entry.moodScore,
          anxiety_score: entry.anxietyScore,
          loneliness_score: entry.lonelinessScore,
          safety_score: entry.safetyScore,
          hardest_thing: entry.hardestThing,
          tags: entry.tags,
          created_at: entry.createdAt,
        }, { onConflict: 'user_id,date' });
        if (error) console.error('Check-in sync failed:', error.message);
      }
    }

    if (mood >= 4) setSafetyLevel('green');
    else if (mood === 3) setSafetyLevel('yellow');
    else setSafetyLevel('red');

    setAlreadyCheckedIn(true);
    setRecentCheckIns(await getRecentCheckIns(7));
    setLoading(false);

    const moodVal = mood;
    Alert.alert(t('checkin.saved'), t('checkin.savedBody'), [
      { text: t('checkin.done'), onPress: () => router.back() },
      {
        text: t('checkin.gentleReflection'),
        onPress: () => router.replace({ pathname: '/ai-companion', params: { moodScore: String(moodVal) } }),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.back')}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('checkin.title')}</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {alreadyCheckedIn && (
          <Card style={styles.doneBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.softGreen} />
            <Text style={styles.doneText}>{t('checkin.alreadyCheckedIn')}</Text>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkin.moodSection')}</Text>
          <MoodPicker value={mood} onChange={setMood} />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkin.slidersSection')}</Text>
          <RangeSlider
            label={t('checkin.anxiety')}
            value={anxiety}
            onValueChange={setAnxiety}
            minLabel={t('checkin.calm')}
            maxLabel={t('checkin.overwhelmed')}
            color="#E8844E"
          />
          <RangeSlider
            label={t('checkin.loneliness')}
            value={loneliness}
            onValueChange={setLoneliness}
            minLabel={t('checkin.connected')}
            maxLabel={t('checkin.isolated')}
            color={Colors.mutedLavender}
          />
          <RangeSlider
            label={t('checkin.safetySlider')}
            value={safetySlider}
            onValueChange={setSafetySlider}
            minLabel={t('checkin.unsafe')}
            maxLabel={t('checkin.safe')}
            color={Colors.softGreen}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkin.triggersSection')}</Text>
          <View style={styles.tags}>
            {TRIGGER_TAGS.map((tag) => (
              <Tag
                key={tag}
                label={t(`checkin.triggerTags.${tag}` as any)}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkin.hardestSection')}</Text>
          <TextInput
            style={styles.textInput}
            value={hardestThing}
            onChangeText={setHardestThing}
            placeholder={t('checkin.hardestPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
            accessibilityLabel={t('checkin.hardestSection')}
          />
        </Card>

        {recentCheckIns.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('checkin.moodChart')}</Text>
            <MoodChart checkIns={recentCheckIns} />
          </Card>
        )}

        <Button
          label={alreadyCheckedIn ? t('checkin.updateBtn') : t('checkin.saveBtn')}
          onPress={handleSave}
          loading={loading}
          style={styles.cta}
        />
      </ScrollView>
      </KeyboardAvoidingView>

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

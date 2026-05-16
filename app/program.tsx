import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmergencyButton } from '@/components/EmergencyButton';
import { getProgramById, getCompletedLessonIds, markLessonComplete } from '@/services/programs';
import type { Program, Lesson } from '@/types';

export default function ProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getProgramById(id), getCompletedLessonIds()]).then(([prog, completed]) => {
      setProgram(prog);
      setCompletedIds(completed);
      // Auto-expand first incomplete lesson
      if (prog) {
        const first = prog.lessons.find((l) => !completed.has(l.id));
        if (first) setExpandedLesson(first.id);
      }
    });
  }, [id]);

  async function handleComplete(lesson: Lesson) {
    if (!program) return;
    setLoading(true);
    await markLessonComplete(lesson.id, program.id);
    const updated = await getCompletedLessonIds();
    setCompletedIds(updated);
    setLoading(false);

    // Auto-advance to next lesson
    const idx = program.lessons.findIndex((l) => l.id === lesson.id);
    const next = program.lessons[idx + 1];
    if (next) {
      setExpandedLesson(next.id);
    } else {
      Alert.alert(
        '🎉 Program complete!',
        `You've finished "${program.title}". Take a moment to appreciate how far you've come.`,
        [{ text: 'Thank you', onPress: () => router.back() }]
      );
    }
  }

  if (!program) return null;

  const completedCount = program.lessons.filter((l) => completedIds.has(l.id)).length;
  const pct = completedCount / program.lessons.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <Text style={styles.title}>{program.title}</Text>
            <Text style={styles.subtitle}>{program.description}</Text>
          </View>
        </View>

        {/* Overall progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{completedCount} of {program.lessons.length} lessons complete</Text>
            <Text style={[styles.progressPct, { color: program.color }]}>{Math.round(pct * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: program.color }]} />
          </View>
        </Card>

        {/* Lessons */}
        {program.lessons.map((lesson) => {
          const done = completedIds.has(lesson.id);
          const expanded = expandedLesson === lesson.id;

          return (
            <View key={lesson.id} style={styles.lessonWrapper} testID={`lesson-${lesson.id}`}>
              <TouchableOpacity
                style={[styles.lessonHeader, done && styles.lessonHeaderDone]}
                onPress={() => setExpandedLesson(expanded ? null : lesson.id)}
                accessibilityLabel={lesson.title}
              >
                <View style={[styles.lessonNum, done && { backgroundColor: Colors.softGreen }]}>
                  {done
                    ? <Ionicons name="checkmark" size={14} color={Colors.white} />
                    : <Text style={styles.lessonNumText}>{lesson.order}</Text>
                  }
                </View>
                <Text style={[styles.lessonTitle, done && styles.lessonTitleDone]}>{lesson.title}</Text>
                <View style={styles.lessonMeta}>
                  <Text style={styles.lessonTime}>{lesson.readTime} min</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>

              {expanded && (
                <View style={styles.lessonBody}>
                  <Text style={styles.lessonText}>{lesson.body}</Text>

                  <Card style={[styles.reflectionCard, { borderLeftColor: program.color }]}>
                    <Text style={[styles.reflectionLabel, { color: program.color }]}>Reflection</Text>
                    <Text style={styles.reflectionPrompt}>{lesson.reflectionPrompt}</Text>
                    <TouchableOpacity
                      style={styles.journalLink}
                      onPress={() => router.push('/journal-entry')}
                      accessibilityLabel="Write in journal"
                    >
                      <Ionicons name="create-outline" size={14} color={Colors.safeBlue} />
                      <Text style={styles.journalLinkText}>Write in journal</Text>
                    </TouchableOpacity>
                  </Card>

                  {!done && (
                    <Button
                      label="Mark complete"
                      onPress={() => handleComplete(lesson)}
                      loading={loading}
                      style={[styles.completeBtn, { backgroundColor: program.color }]}
                      testID={`complete-${lesson.id}`}
                    />
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  headerRight: { flex: 1, gap: Spacing.xs },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  progressCard: { gap: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 14, color: Colors.textSecondary },
  progressPct: { fontSize: 16, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  lessonWrapper: { borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  lessonHeaderDone: { backgroundColor: Colors.softGreen + '0A' },
  lessonNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lessonNumText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  lessonTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  lessonTitleDone: { color: Colors.textMuted },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  lessonTime: { fontSize: 12, color: Colors.textMuted },
  lessonBody: {
    backgroundColor: Colors.warmWhite,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  lessonText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 24 },
  reflectionCard: {
    borderLeftWidth: 3,
    gap: Spacing.sm,
    backgroundColor: Colors.softGray,
  },
  reflectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  reflectionPrompt: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22, fontStyle: 'italic' },
  journalLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  journalLinkText: { fontSize: 13, color: Colors.safeBlue, fontWeight: '600' },
  completeBtn: { borderRadius: Radius.md },
});

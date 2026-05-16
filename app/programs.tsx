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
import { EmergencyButton } from '@/components/EmergencyButton';
import { getAllProgramsWithProgress } from '@/services/programs';
import type { Program } from '@/types';

type ProgramWithProgress = Program & { completed: number; total: number };

export default function ProgramsScreen() {
  const [programs, setPrograms] = useState<ProgramWithProgress[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllProgramsWithProgress().then(setPrograms);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Healing Programs</Text>
        </View>
        <Text style={styles.subtitle}>Structured paths for recovery — go at your own pace.</Text>

        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            onPress={() => router.push({ pathname: '/program', params: { id: program.id } })}
          />
        ))}
      </ScrollView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

function ProgramCard({
  program,
  onPress,
}: {
  program: ProgramWithProgress;
  onPress: () => void;
}) {
  const pct = program.total > 0 ? program.completed / program.total : 0;
  const started = program.completed > 0;
  const done = program.completed === program.total;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} testID={`program-${program.id}`}>
      <Card elevated style={styles.card}>
        <View style={[styles.iconBg, { backgroundColor: program.color + '18' }]}>
          <Ionicons name={program.icon as any} size={26} color={program.color} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{program.title}</Text>
            {done && <Ionicons name="checkmark-circle" size={18} color={Colors.softGreen} />}
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{program.description}</Text>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: program.color }]} />
            </View>
            <Text style={styles.progressLabel}>
              {program.completed}/{program.total} lessons
            </Text>
          </View>

          <View style={styles.lessonMeta}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.lessonMetaText}>{program.total} lessons · ~{program.total * 4} min total</Text>
          </View>
        </View>

        <View style={[styles.cta, { backgroundColor: program.color }]}>
          <Text style={styles.ctaText}>{done ? 'Review' : started ? 'Continue' : 'Start'}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  iconBg: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: Colors.textMuted, minWidth: 60, textAlign: 'right' },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lessonMetaText: { fontSize: 12, color: Colors.textMuted },
  cta: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  ctaText: { fontSize: 12, fontWeight: '700', color: Colors.white },
});

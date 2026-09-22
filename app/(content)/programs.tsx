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
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { getAllProgramsWithProgress } from '@/services/content/programs';
import type { Program } from '@/types';

type ProgramWithProgress = Program & { completed: number; total: number };

export default function ProgramsScreen() {
  const { t, i18n } = useTranslation();
  const [programs, setPrograms] = useState<ProgramWithProgress[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllProgramsWithProgress(i18n.language).then(setPrograms);
    }, [i18n.language])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.back')}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('programs.title')}</Text>
        </View>
        <Text style={styles.subtitle}>{t('programs.subtitle')}</Text>

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
  const { t } = useTranslation();
  const pct = program.total > 0 ? program.completed / program.total : 0;
  const started = program.completed > 0;
  const done = program.completed === program.total;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} testID={`program-${program.id}`}>
      <Card elevated style={styles.card}>
        <Ionicons name={program.icon as any} size={26} color={Colors.textMuted} style={styles.icon} />

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{program.title}</Text>
            {done && <Ionicons name="checkmark-circle" size={16} color={Colors.textSecondary} />}
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{program.description}</Text>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>
              {program.completed}/{program.total}
            </Text>
          </View>

          <View style={styles.lessonMeta}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.lessonMetaText}>
              {t('programs.lessonsTime', { lessons: program.total, minutes: program.total * 4 })}
            </Text>
          </View>
        </View>

        <View style={[styles.cta, started && !done && styles.ctaStarted]}>
          <Text style={[styles.ctaText, started && !done && styles.ctaStartedText]}>
            {done ? t('programs.review') : started ? t('programs.continue') : t('programs.start')}
          </Text>
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
  icon: { flexShrink: 0, marginTop: 2 },
  cardBody: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.35)' },
  progressLabel: { fontSize: 11, color: Colors.textMuted, minWidth: 36, textAlign: 'right' },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lessonMetaText: { fontSize: 12, color: Colors.textMuted },
  cta: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ctaStarted: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  ctaText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  ctaStartedText: { color: Colors.black },
});

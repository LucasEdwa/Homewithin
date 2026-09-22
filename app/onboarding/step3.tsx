import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { syncProfile } from '@/services/social/matching';
import { INTENTIONS, type IntentionId } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OnboardingStep3() {
  const { t } = useTranslation();
  const { profile, setProfile } = useSession();
  const [selected, setSelected] = useState<Set<IntentionId>>(new Set());
  const [loading, setLoading] = useState(false);

  const intentions = INTENTIONS.map((item) => ({
    ...item,
    label: t(`intentions.${item.id}.label` as any),
    description: t(`intentions.${item.id}.description` as any),
  }));

  function toggle(id: IntentionId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleFinish() {
    setLoading(true);
    const intentions = Array.from(selected);
    if (profile) {
      const updated = { ...profile, intentions };
      await setProfile(updated);
      await syncProfile(updated).catch((e) =>
        console.warn('Intentions sync failed:', e?.message)
      );
    }
    router.replace('/safety');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progress}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Text style={styles.title}>{t('onboarding.step3.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.step3.subtitle')}</Text>

        <View style={styles.list}>
          {intentions.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => toggle(item.id)}
                activeOpacity={0.75}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${item.label} — ${item.description}`}
              >
                <View style={[styles.iconBg, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hint}>{t('onboarding.step3.hint')}</Text>

        <Button
          label={loading ? t('common.finishing') : t('common.getStarted')}
          onPress={handleFinish}
          loading={loading}
          style={styles.cta}
        />

        <TouchableOpacity onPress={handleFinish} style={styles.skip} accessibilityLabel={t('common.skip')}>
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
  progress: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.safeBlue, width: 24 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  list: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.softGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowSelected: { borderColor: Colors.safeBlue, backgroundColor: Colors.safeBlue + '10' },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  desc: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: Colors.safeBlue, borderColor: Colors.safeBlue },
  hint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  cta: { marginTop: Spacing.sm },
  skip: { alignItems: 'center' },
  skipText: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'underline' },
  back: { alignItems: 'center' },
  backText: { fontSize: 14, color: Colors.textMuted },
});

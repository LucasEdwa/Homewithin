import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';
import { supabase } from '@/services/supabase';
import { useTranslation } from 'react-i18next';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Need {
  id: string;
  label: string;
  icon: IoniconsName;
  color: string;
  description: string;
}

const NEED_META: { id: string; icon: IoniconsName; color: string }[] = [
  { id: 'emotional_safety', icon: 'shield-checkmark-outline', color: Colors.safeBlue },
  { id: 'healing',          icon: 'leaf-outline',             color: Colors.softGreen },
  { id: 'someone_to_talk',  icon: 'chatbubbles-outline',      color: Colors.mutedLavender },
  { id: 'gay_friends',      icon: 'people-circle-outline',    color: Colors.safeBlue },
  { id: 'support_group',    icon: 'people-outline',           color: Colors.softGreen },
  { id: 'crisis_help',      icon: 'alert-circle-outline',     color: Colors.alertRed },
];

export default function OnboardingStep2() {
  const { t } = useTranslation();
  const { profile, setProfile, completeOnboarding } = useSession();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const needs: Need[] = NEED_META.map((m) => ({
    ...m,
    label: t(`onboarding.step2.needs.${m.id}.label` as any),
    description: t(`onboarding.step2.needs.${m.id}.description` as any),
  }));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleNext() {
    setLoading(true);

    const authUser = supabase
      ? (await supabase.auth.getUser().catch(() => ({ data: { user: null } }))).data.user
      : null;

    const isAnonymous = !authUser;
    const updated = profile
      ? { ...profile, needs: Array.from(selected), isAnonymous }
      : null;

    if (updated) await setProfile(updated);
    await completeOnboarding();

    if (!authUser && supabase) {
      // Guest — create an anonymous Supabase session before step3 so syncProfile works.
      const { error: anonErr } = await supabase.auth.signInAnonymously();
      if (anonErr) console.warn('Anonymous sign-in failed:', anonErr.message);
    }

    setLoading(false);
    router.push('/onboarding/step3');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.progress}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>{t('onboarding.step2.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.step2.subtitle')}</Text>

        <View style={styles.grid}>
          {needs.map((need) => {
            const isSelected = selected.has(need.id);
            return (
              <TouchableOpacity
                key={need.id}
                style={[styles.needCard, isSelected && styles.needCardSelected]}
                onPress={() => toggle(need.id)}
                activeOpacity={0.75}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${need.label} — ${need.description}`}
              >
                <View style={[styles.iconBg, { backgroundColor: need.color + '18' }]}>
                  <Ionicons name={need.icon} size={22} color={isSelected ? need.color : Colors.textMuted} />
                </View>
                <Text style={[styles.needLabel, isSelected && styles.needLabelSelected]}>
                  {need.label}
                </Text>
                <Text style={styles.needDescription}>{need.description}</Text>
                {isSelected && (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button label={t('common.continue')} onPress={handleNext} loading={loading} style={styles.cta} />
          <TouchableOpacity onPress={handleNext} accessibilityLabel={t('common.skip')}>
            <Text style={styles.skip}>{t('common.skip')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  progress: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.safeBlue, width: 24 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  needCard: {
    width: '47%',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    gap: Spacing.xs,
  },
  needCardSelected: {
    backgroundColor: Colors.safeBlue + '0D',
    borderColor: Colors.safeBlue,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  needLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  needLabelSelected: { color: Colors.safeBlue },
  needDescription: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },
  check: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: Spacing.md, alignItems: 'center', marginTop: Spacing.xl },
  cta: { width: '100%' },
  skip: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'underline' },
  back: { alignItems: 'center', marginTop: Spacing.lg },
  backText: { fontSize: 14, color: Colors.textMuted },
});

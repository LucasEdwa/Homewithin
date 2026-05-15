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

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Need {
  id: string;
  label: string;
  icon: IoniconsName;
  color: string;
  description: string;
}

const NEEDS: Need[] = [
  { id: 'emotional_safety', label: 'Emotional safety', icon: 'shield-checkmark-outline', color: Colors.safeBlue,      description: 'I need to feel safe right now' },
  { id: 'healing',          label: 'Healing',          icon: 'leaf-outline',             color: Colors.softGreen,     description: 'I want to process what happened' },
  { id: 'someone_to_talk',  label: 'Someone to talk',  icon: 'chatbubbles-outline',      color: Colors.mutedLavender, description: 'I just need to be heard' },
  { id: 'gay_friends',      label: 'Find community',   icon: 'people-circle-outline',    color: Colors.safeBlue,      description: 'Find people like me' },
  { id: 'support_group',    label: 'Support group',    icon: 'people-outline',           color: Colors.softGreen,     description: 'A circle I can belong to' },
  { id: 'crisis_help',      label: 'Crisis help',      icon: 'alert-circle-outline',     color: Colors.alertRed,      description: 'I need urgent support right now' },
];

export default function OnboardingStep2() {
  const { profile, setProfile, completeOnboarding } = useSession();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleFinish() {
    setLoading(true);
    if (profile) {
      await setProfile({ ...profile, needs: Array.from(selected), isAnonymous: true });
    }
    await completeOnboarding();
    router.replace('/safety');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.progress}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Text style={styles.title}>What would help most today?</Text>
        <Text style={styles.subtitle}>
          Choose as many as you like. You can change this anytime.
        </Text>

        <View style={styles.grid}>
          {NEEDS.map((need) => {
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
          <Button label="Get started" onPress={handleFinish} loading={loading} style={styles.cta} />
          <TouchableOpacity onPress={handleFinish} accessibilityLabel="Skip this step">
            <Text style={styles.skip}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
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

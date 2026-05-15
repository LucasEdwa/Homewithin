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
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';
import { syncProfile } from '@/services/matching';
import { INTENTIONS, type IntentionId } from '@/types';

export default function IntentionsScreen() {
  const { profile, setProfile } = useSession();
  const [selected, setSelected] = useState<Set<IntentionId>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(new Set((profile?.intentions ?? []) as IntentionId[]));
  }, [profile]);

  function toggle(id: IntentionId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const intentions = Array.from(selected);
    const updated = { ...profile, intentions };
    await setProfile(updated);
    await syncProfile(updated);
    setSaving(false);
    Alert.alert('Saved', 'Your matching preferences are updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>What I'm open to</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Pick the kinds of connections you're willing to offer others. People searching
          for one of these will be able to find you. You can change this anytime.
        </Text>

        <View style={styles.list}>
          {INTENTIONS.map((item) => {
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

        <Button
          label={saving ? 'Saving…' : 'Save'}
          onPress={handleSave}
          loading={saving}
          style={styles.cta}
        />

        <Text style={styles.hint}>
          Leaving everything unchecked means you won't appear in anyone's matches.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 80 },
  intro: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
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
  cta: { marginTop: Spacing.md },
  hint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
});

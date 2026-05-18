import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45+'];
const LANGUAGES = ['English', 'Portuguese', 'Spanish', 'French', 'German', 'Other'];
const PRONOUNS = ['he/him', 'she/her', 'they/them', 'ze/zir', 'Prefer not to say'];

export default function OnboardingStep1() {
  const { setProfile } = useSession();
  const [nickname, setNickname] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [language, setLanguage] = useState('English');
  const [country, setCountry] = useState('');
  const [hideFromSearch, setHideFromSearch] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!nickname.trim()) e.nickname = 'Please choose a nickname.';
    if (!ageRange) e.ageRange = 'Please select your age range.';
    if (!country.trim()) e.country = 'Please enter your background.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;
    await setProfile({
      nickname: nickname.trim(),
      pronouns,
      ageRange,
      language,
      country: country.trim(),
      hideFromSearch,
      needs: [],
      intentions: [],
      isAnonymous: true,
    });
    router.push('/onboarding/step2');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progress}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>Tell us a little about you</Text>
        <Text style={styles.subtitle}>
          No real name needed. This stays private to you.
        </Text>

        <View style={styles.form}>
          <Input
            label="Nickname"
            placeholder="e.g. River, Sage, Alex"
            value={nickname}
            onChangeText={setNickname}
            error={errors.nickname}
            autoCapitalize="words"
            maxLength={30}
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Pronouns</Text>
            <View style={styles.chips}>
              {PRONOUNS.map((p) => (
                <Chip key={p} label={p} selected={pronouns === p} onPress={() => setPronouns(p)} />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Age range {errors.ageRange ? <Text style={styles.err}> — {errors.ageRange}</Text> : null}</Text>
            <View style={styles.chips}>
              {AGE_RANGES.map((a) => (
                <Chip key={a} label={a} selected={ageRange === a} onPress={() => setAgeRange(a)} />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Language</Text>
            <View style={styles.chips}>
              {LANGUAGES.map((l) => (
                <Chip key={l} label={l} selected={language === l} onPress={() => setLanguage(l)} />
              ))}
            </View>
          </View>

          <Input
            label="Your background"
            placeholder="e.g. Sweden, Brazil, Syria, Somalia…"
            value={country}
            onChangeText={setCountry}
            error={errors.country}
            autoCapitalize="words"
            returnKeyType="done"
          />

          <View style={styles.toggle}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Hide my profile from search</Text>
              <Text style={styles.toggleHint}>Others won't be able to find you unless you connect first.</Text>
            </View>
            <Switch
              value={hideFromSearch}
              onValueChange={setHideFromSearch}
              trackColor={{ true: Colors.safeBlue, false: Colors.border }}
              thumbColor={Colors.white}
              accessibilityLabel="Hide profile from search"
            />
          </View>
        </View>

        <Button label="Continue" onPress={handleNext} style={styles.cta} />

        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[chipStyles.chip, selected && chipStyles.selected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[chipStyles.text, selected && chipStyles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.softGray,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: Spacing.xs,
  },
  selected: {
    backgroundColor: Colors.safeBlue + '18',
    borderColor: Colors.safeBlue,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  selectedText: {
    color: Colors.safeBlue,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  progress: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.safeBlue, width: 24 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.sm },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  toggleHint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cta: { marginTop: Spacing.xl },
  back: { alignItems: 'center', marginTop: Spacing.lg },
  backText: { fontSize: 14, color: Colors.textMuted },
  err: { color: Colors.alertRed, fontSize: 12 },
});

import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { createProfessionalProfile } from '@/services/professional/directory';
import { SPECIALTY_LABELS, type CreateProfessionalProfileInput, type Specialty } from '@/types/professional';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ALL_SPECIALTIES = Object.keys(SPECIALTY_LABELS) as Specialty[];

export default function RegisterProfessionalScreen() {
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [languages, setLanguages] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [priceSek, setPriceSek] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleSpecialty(s: Specialty) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit() {
    if (!displayName.trim() || !title.trim() || !licenseNumber.trim()) {
      Alert.alert('Missing fields', 'Please fill in your name, title, and license number.');
      return;
    }
    if (specialties.length === 0) {
      Alert.alert('Missing fields', 'Please select at least one specialty.');
      return;
    }

    setLoading(true);
    try {
      const input: CreateProfessionalProfileInput = {
        displayName: displayName.trim(),
        title: title.trim(),
        bio: bio.trim(),
        specialties,
        languages: languages
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
        licenseNumber: licenseNumber.trim(),
        sessionPriceSekOre: Math.round(parseFloat(priceSek || '0') * 100),
      };
      await createProfessionalProfile(input);
      Alert.alert(
        'Application submitted',
        'Your profile is pending verification. We\'ll notify you once approved.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.heading}>Become a Professional</Text>
          <Text style={styles.subheading}>
            Apply to join the HomeWithin directory of LGBTQ+-affirming therapists.
            Your profile will be reviewed before going live.
          </Text>

          {/* Fields */}
          <Field label="Full name *">
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Dr. Alex Johansson"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>

          <Field label="Professional title *">
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Licensed Psychologist"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>

          <Field label="License number *">
            <TextInput
              style={styles.input}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="SE-1234567"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
          </Field>

          <Field label="Session price (SEK)">
            <TextInput
              style={styles.input}
              value={priceSek}
              onChangeText={setPriceSek}
              placeholder="850"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </Field>

          <Field label="Languages (comma-separated)">
            <TextInput
              style={styles.input}
              value={languages}
              onChangeText={setLanguages}
              placeholder="Swedish, English"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>

          <Field label="Bio">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell clients about your background and approach…"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
          </Field>

          {/* Specialties */}
          <Field label="Specialties *">
            <View style={styles.chipGrid}>
              {ALL_SPECIALTIES.map((s) => {
                const selected = specialties.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleSpecialty(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {SPECIALTY_LABELS[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Submitting…' : 'Submit Application'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  backBtn: { marginBottom: Spacing.sm },
  heading: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subheading: { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: '#fff',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: Colors.safeBlue, borderColor: Colors.safeBlue },
  chipText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  submitBtn: {
    backgroundColor: Colors.safeBlue,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

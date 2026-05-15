import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SafetySlider } from '@/components/ui/SafetySlider';
import { useSession } from '@/context/SessionContext';
import { saveSafetyPlan } from '@/services/storage';
import { getHotlinesForCountry } from '@/constants/hotlines';
import { computeSafetyScore, SafetyStatus } from '@/services/safetyScore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Question { id: string; label: string; icon: IoniconsName }
const QUESTIONS: Question[] = [
  { id: 'lives_with_family',   label: 'I currently live with family',          icon: 'home-outline' },
  { id: 'phone_access_risk',   label: 'Someone might check my phone',          icon: 'phone-portrait-outline' },
  { id: 'currently_in_danger', label: 'I feel in danger right now',            icon: 'warning-outline' },
  { id: 'trusted_contact',     label: 'I have a trusted person I can contact', icon: 'heart-outline' },
];

export default function SafetyScreen() {
  const { setSafetyLevel, profile } = useSession();
  const [moodScore, setMoodScore] = useState(7);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [safetyPlanText, setSafetyPlanText] = useState('');
  const [assessed, setAssessed] = useState(false);
  const [status, setStatus] = useState<SafetyStatus>('green');
  const [savingPlan, setSavingPlan] = useState(false);

  function toggleAnswer(id: string) {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAssess() {
    const computed = computeSafetyScore(moodScore, answers);
    setStatus(computed);
    setSafetyLevel(computed);
    setAssessed(true);
  }

  async function handleSavePlan() {
    if (!safetyPlanText.trim()) return;
    setSavingPlan(true);
    const steps = safetyPlanText.split('\n').map((s) => s.trim()).filter(Boolean);
    await saveSafetyPlan(steps);
    setSavingPlan(false);
    Alert.alert('Saved', 'Your safety plan has been saved securely.');
  }

  const countryHotlines = profile?.country ? getHotlinesForCountry(profile.country) : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>How are you feeling right now?</Text>
        <Text style={styles.subtitle}>
          This helps us understand what kind of support might help most.
        </Text>

        <Card style={styles.card}>
          <SafetySlider
            label="How safe do you feel right now?"
            minLabel="Unsafe"
            maxLabel="Safe"
            value={moodScore}
            onValueChange={setMoodScore}
            minimumValue={1}
            maximumValue={10}
          />
        </Card>

        <View style={styles.questions}>
          {QUESTIONS.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={[styles.question, answers[q.id] && styles.questionSelected]}
              onPress={() => toggleAnswer(q.id)}
              activeOpacity={0.75}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!answers[q.id] }}
              accessibilityLabel={q.label}
            >
              <Ionicons
                name={q.icon}
                size={20}
                color={answers[q.id] ? Colors.safeBlue : Colors.textMuted}
              />
              <Text style={[styles.questionLabel, answers[q.id] && styles.questionLabelSelected]}>
                {q.label}
              </Text>
              <View style={[styles.checkbox, answers[q.id] && styles.checkboxSelected]}>
                {answers[q.id] && <Ionicons name="checkmark" size={13} color={Colors.white} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!assessed ? (
          <Button label="Check my safety" onPress={handleAssess} style={styles.assessBtn} />
        ) : (
          <View style={styles.result}>
            {status === 'green' && <GreenState />}
            {status === 'yellow' && <YellowState />}
            {status === 'red' && <RedState hotlines={countryHotlines} />}

            <Card style={styles.planCard}>
              <Text style={styles.planTitle}>Create a safety plan</Text>
              <Text style={styles.planHint}>
                Write steps you'd take if you felt unsafe. Saved only on your device.
              </Text>
              <TextInput
                style={styles.planInput}
                placeholder={"1. Text my friend Alex\n2. Go to the library\n3. Call the helpline"}
                placeholderTextColor={Colors.textMuted}
                value={safetyPlanText}
                onChangeText={setSafetyPlanText}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                accessibilityLabel="Safety plan steps"
              />
              <Button
                label={savingPlan ? 'Saving…' : 'Save safety plan'}
                onPress={handleSavePlan}
                variant="secondary"
                loading={savingPlan}
                style={{ marginTop: Spacing.md }}
              />
            </Card>

            <Button label="Go to home" onPress={() => router.replace('/(tabs)')} style={styles.homeBtn} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GreenState() {
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.safetyGreen }]}>
      <Ionicons name="checkmark-circle" size={44} color={Colors.safetyGreen} />
      <Text style={[styles.statusTitle, { color: Colors.safetyGreen }]}>You seem safe.</Text>
      <Text style={styles.statusBody}>
        That's good. HomeWithin is here whenever you need connection, healing, or support.
      </Text>
    </Card>
  );
}

function YellowState() {
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.safetyYellow }]}>
      <Ionicons name="alert-circle" size={44} color={Colors.safetyYellow} />
      <Text style={[styles.statusTitle, { color: '#8A6A00' }]}>Some support may help.</Text>
      <Text style={styles.statusBody}>
        It's okay to not be okay. Connecting with a peer or reading some resources might help right now.
      </Text>
    </Card>
  );
}

function RedState({ hotlines }: { hotlines: ReturnType<typeof getHotlinesForCountry> }) {
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.alertRed }]}>
      <Ionicons name="close-circle" size={44} color={Colors.alertRed} />
      <Text style={[styles.statusTitle, { color: Colors.alertRed }]}>You may need immediate support.</Text>
      <Text style={styles.statusBody}>
        You don't have to go through this alone. Please reach out to a crisis line or trusted person.
      </Text>
      {hotlines?.hotlines.map((h) => (
        <View key={h.name} style={styles.hotline}>
          <Text style={styles.hotlineName}>{h.name}</Text>
          <Text style={styles.hotlineNumber}>{h.number}</Text>
        </View>
      ))}
      {!hotlines && (
        <TouchableOpacity onPress={() => router.push('/emergency')}>
          <Text style={styles.viewHotlines}>View all crisis hotlines →</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  card: { marginBottom: Spacing.lg },
  questions: { gap: Spacing.sm, marginBottom: Spacing.lg },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: Spacing.sm,
  },
  questionSelected: { backgroundColor: Colors.safeBlue + '10', borderColor: Colors.safeBlue },
  questionLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  questionLabelSelected: { color: Colors.safeBlue, fontWeight: '500' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.safeBlue, borderColor: Colors.safeBlue },
  assessBtn: { marginTop: Spacing.md },
  result: { gap: Spacing.lg },
  statusCard: { borderWidth: 2, backgroundColor: Colors.white, alignItems: 'center', gap: Spacing.sm },
  statusTitle: { fontSize: 20, fontWeight: '700' },
  statusBody: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  hotline: { backgroundColor: Colors.softGray, borderRadius: Radius.sm, padding: Spacing.sm, width: '100%', marginTop: Spacing.xs },
  hotlineName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  hotlineNumber: { fontSize: 15, fontWeight: '700', color: Colors.alertRed },
  viewHotlines: { color: Colors.safeBlue, fontSize: 15, textDecorationLine: 'underline', marginTop: Spacing.sm },
  planCard: { backgroundColor: Colors.white },
  planTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
  planHint: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 18 },
  planInput: { backgroundColor: Colors.softGray, borderRadius: Radius.md, padding: Spacing.md, fontSize: 15, color: Colors.textPrimary, minHeight: 110 },
  homeBtn: { marginTop: Spacing.xs },
});

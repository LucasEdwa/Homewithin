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
  Linking,
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
import { computeSafetyScore, hasCrisisSignal, SafetyAnswers, SafetyStatus } from '@/services/safetyScore';
import type { LocalResource } from '@/types';
import { LOCAL_RESOURCE_TYPE_LABELS, LOCAL_RESOURCE_TYPE_ICONS, LOCAL_RESOURCE_TYPE_COLORS } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Step definitions ────────────────────────────────────────────────────────

interface StepQuestion {
  id: keyof SafetyAnswers;
  label: string;
  sublabel?: string;
  icon: IoniconsName;
  riskDirection: 'risk' | 'protective';
}

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: IoniconsName;
  iconColor: string;
  questions: StepQuestion[];
  hasSlider?: boolean;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Right now',
    subtitle: 'Let\'s start with how you\'re feeling in this moment. There\'s no wrong answer.',
    icon: 'time-outline',
    iconColor: Colors.safeBlue,
    hasSlider: true,
    questions: [
      {
        id: 'currently_in_danger',
        label: 'I feel in danger right now',
        sublabel: 'Physical threat, or someone who could hurt you',
        icon: 'warning-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 2,
    title: 'Home & body',
    subtitle: 'Your physical safety and where you live matter deeply. These answers stay private.',
    icon: 'home-outline',
    iconColor: '#E8844E',
    questions: [
      {
        id: 'physical_abuse',
        label: 'I\'ve experienced physical harm at home',
        sublabel: 'Hitting, pushing, or any physical violence',
        icon: 'body-outline',
        riskDirection: 'risk',
      },
      {
        id: 'emotional_control',
        label: 'Someone controls or manipulates me emotionally',
        sublabel: 'Being silenced, shamed, or told who you can be',
        icon: 'lock-closed-outline',
        riskDirection: 'risk',
      },
      {
        id: 'housing_unstable',
        label: 'My housing feels unstable or threatened',
        sublabel: 'Risk of being kicked out or made homeless',
        icon: 'home-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 3,
    title: 'Identity & pressure',
    subtitle: 'Being LGBTQ+ can bring specific pressures. These questions help us understand yours.',
    icon: 'person-outline',
    iconColor: Colors.mutedLavender,
    questions: [
      {
        id: 'conversion_pressure',
        label: 'Someone is pressuring me to change or hide who I am',
        sublabel: 'Religious pressure, conversion therapy, or being told to "fix" yourself',
        icon: 'refresh-circle-outline',
        riskDirection: 'risk',
      },
      {
        id: 'outed_recently',
        label: 'I was recently outed without my consent',
        sublabel: 'Someone disclosed your identity without permission',
        icon: 'megaphone-outline',
        riskDirection: 'risk',
      },
      {
        id: 'phone_surveillance',
        label: 'Someone monitors my phone or messages',
        sublabel: 'A family member or partner checking your activity',
        icon: 'phone-portrait-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 4,
    title: 'School & community',
    subtitle: 'Safety isn\'t only about home. Tell us how things feel outside of it.',
    icon: 'people-outline',
    iconColor: '#8B6FB5',
    questions: [
      {
        id: 'bullied_at_school',
        label: 'I\'m being bullied or harassed at school or work',
        sublabel: 'Name-calling, exclusion, threats, or physical intimidation',
        icon: 'alert-circle-outline',
        riskDirection: 'risk',
      },
      {
        id: 'community_hostility',
        label: 'My neighbors or community are hostile toward me',
        sublabel: 'Harassment, discrimination, or feeling unwelcome where you live',
        icon: 'home-outline',
        riskDirection: 'risk',
      },
      {
        id: 'unsafe_outside_home',
        label: 'I feel unsafe or anxious when I leave home',
        sublabel: 'Constant vigilance or fear in public spaces',
        icon: 'navigate-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 5,
    title: 'Your mind',
    subtitle: 'This is the most private step. You\'re safe to be honest here — it helps us support you better.',
    icon: 'heart-outline',
    iconColor: Colors.softGreen,
    questions: [
      {
        id: 'self_harm_thoughts',
        label: 'I\'ve been having thoughts of hurting myself or not wanting to be here',
        sublabel: 'Any thought of self-harm or suicide, however small',
        icon: 'alert-circle-outline',
        riskDirection: 'risk',
      },
      {
        id: 'hopelessness',
        label: 'I feel completely hopeless about my situation',
        sublabel: 'Like things will never get better',
        icon: 'cloud-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 6,
    title: 'Your resources',
    subtitle: 'These are the things that protect you. Even one of these matters enormously.',
    icon: 'shield-checkmark-outline',
    iconColor: Colors.softGreen,
    questions: [
      {
        id: 'trusted_contact',
        label: 'I have at least one person who fully accepts me',
        sublabel: 'Someone who knows and loves who you are',
        icon: 'heart-outline',
        riskDirection: 'protective',
      },
      {
        id: 'safe_place',
        label: 'I have somewhere safe I could go if I needed to',
        sublabel: 'A friend\'s place, shelter, or another option',
        icon: 'navigate-outline',
        riskDirection: 'protective',
      },
      {
        id: 'basic_needs_met',
        label: 'My basic needs feel stable right now',
        sublabel: 'Food, shelter, and physical safety',
        icon: 'checkmark-circle-outline',
        riskDirection: 'protective',
      },
    ],
  },
];

// ─── Plan prompts ─────────────────────────────────────────────────────────────

const PLAN_PROMPTS = [
  'First person I would contact:',
  'A safe place I could go:',
  'Something I need to hear right now:',
  'One small action I can take in the next hour:',
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SafetyScreen() {
  const { setSafetyLevel, profile, nearbyCounty, nearbyResources } = useSession();
  const [step, setStep] = useState(0); // 0 = intro
  const [moodScore, setMoodScore] = useState(7);
  const [answers, setAnswers] = useState<SafetyAnswers>({});
  const [safetyPlanLines, setSafetyPlanLines] = useState<string[]>(PLAN_PROMPTS.map(() => ''));
  const [assessed, setAssessed] = useState(false);
  const [status, setStatus] = useState<SafetyStatus>('green');
  const [crisisInterrupt, setCrisisInterrupt] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step - 1];

  function toggleAnswer(id: keyof SafetyAnswers) {
    const next = { ...answers, [id]: !answers[id] };
    setAnswers(next);

    // Immediate crisis interrupt on step 4 (mind)
    if ((id === 'self_harm_thoughts' || id === 'currently_in_danger') && !answers[id]) {
      setCrisisInterrupt(true);
    } else if ((id === 'self_harm_thoughts' || id === 'currently_in_danger') && answers[id]) {
      setCrisisInterrupt(false);
    }
  }

  function handleNext() {
    if (step < totalSteps) {
      setStep((s) => s + 1);
      setCrisisInterrupt(false);
    } else {
      finishAssessment();
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((s) => s - 1);
      setCrisisInterrupt(false);
    }
  }

  function finishAssessment() {
    const computed = computeSafetyScore(moodScore, answers);
    setStatus(computed);
    setSafetyLevel(computed);
    setAssessed(true);
  }

  async function handleSavePlan() {
    const steps = safetyPlanLines
      .map((line, i) => line.trim() ? `${PLAN_PROMPTS[i]} ${line.trim()}` : null)
      .filter(Boolean) as string[];
    if (steps.length === 0) return;
    setSavingPlan(true);
    await saveSafetyPlan(steps);
    setSavingPlan(false);
    Alert.alert('Saved', 'Your safety plan is saved only on this device.');
  }

  // Intro
  if (step === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.introHeader}>
            <View style={styles.introIcon}>
              <Ionicons name="shield-outline" size={36} color={Colors.safeBlue} />
            </View>
            <Text style={styles.introTitle}>Safety check-in</Text>
            <Text style={styles.introSubtitle}>
              5 short steps to help us understand how you're doing right now.{'\n\n'}
              Everything stays on your device. You can stop at any point.
            </Text>
          </View>

          <View style={styles.stepPreview}>
            {STEPS.map((s) => (
              <View key={s.id} style={styles.stepPreviewItem}>
                <View style={[styles.stepPreviewIcon, { backgroundColor: s.iconColor + '18' }]}>
                  <Ionicons name={s.icon} size={16} color={s.iconColor} />
                </View>
                <View>
                  <Text style={styles.stepPreviewNum}>Step {s.id}</Text>
                  <Text style={styles.stepPreviewTitle}>{s.title}</Text>
                </View>
              </View>
            ))}
          </View>

          <Button label="Begin" onPress={() => setStep(1)} style={styles.beginBtn} />
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.skipLink}>
            <Text style={styles.skipLinkText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Results
  if (assessed) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {status === 'green' && <GreenState />}
          {status === 'yellow' && <YellowState />}
          {status === 'red' && (
            <RedState
              nearbyCounty={nearbyCounty}
              nearbyResources={nearbyResources}
            />
          )}

          <Card style={styles.planCard}>
            <Text style={styles.planTitle}>Your safety plan</Text>
            <Text style={styles.planHint}>
              Saved only on this device. Fill in what feels right for you.
            </Text>
            {PLAN_PROMPTS.map((prompt, i) => (
              <View key={i} style={styles.planRow}>
                <Text style={styles.planPrompt}>{prompt}</Text>
                <TextInput
                  style={styles.planInput}
                  value={safetyPlanLines[i]}
                  onChangeText={(v) => {
                    const next = [...safetyPlanLines];
                    next[i] = v;
                    setSafetyPlanLines(next);
                  }}
                  placeholder="Write here…"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={120}
                />
              </View>
            ))}
            <Button
              label={savingPlan ? 'Saving…' : 'Save safety plan'}
              onPress={handleSavePlan}
              variant="secondary"
              loading={savingPlan}
              style={{ marginTop: Spacing.md }}
            />
          </Card>

          <Button label="Go to home" onPress={() => router.replace('/(tabs)')} style={styles.homeBtn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step view
  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{step}/{totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Step header */}
        <View style={[styles.stepHeader, { borderLeftColor: currentStep.iconColor }]}>
          <View style={[styles.stepIconBg, { backgroundColor: currentStep.iconColor + '18' }]}>
            <Ionicons name={currentStep.icon} size={22} color={currentStep.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepNum}>Step {step} of {totalSteps}</Text>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
          </View>
        </View>
        <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>

        {/* Mood slider — only on step 1 */}
        {currentStep.hasSlider && (
          <Card style={styles.sliderCard}>
            <SafetySlider
              label="How safe do you feel right now?"
              minLabel="Not safe"
              maxLabel="Completely safe"
              value={moodScore}
              onValueChange={setMoodScore}
              minimumValue={1}
              maximumValue={10}
            />
          </Card>
        )}

        {/* Questions */}
        <View style={styles.questions}>
          {currentStep.questions.map((q) => {
            const checked = !!answers[q.id];
            const isProtective = q.riskDirection === 'protective';
            const activeColor = isProtective ? Colors.softGreen : Colors.alertRed;
            return (
              <TouchableOpacity
                key={q.id}
                style={[
                  styles.question,
                  checked && { borderColor: activeColor, backgroundColor: activeColor + '0D' },
                ]}
                onPress={() => toggleAnswer(q.id)}
                activeOpacity={0.75}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={q.label}
              >
                <View style={[styles.qIconBg, { backgroundColor: activeColor + '18' }]}>
                  <Ionicons
                    name={q.icon}
                    size={18}
                    color={checked ? activeColor : Colors.textMuted}
                  />
                </View>
                <View style={styles.qBody}>
                  <Text style={[styles.qLabel, checked && { color: activeColor, fontWeight: '600' }]}>
                    {q.label}
                  </Text>
                  {q.sublabel && (
                    <Text style={styles.qSublabel}>{q.sublabel}</Text>
                  )}
                </View>
                <View style={[styles.checkbox, checked && { backgroundColor: activeColor, borderColor: activeColor }]}>
                  {checked && <Ionicons name="checkmark" size={13} color={Colors.white} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Crisis interrupt — shown immediately when self-harm or danger is checked */}
        {crisisInterrupt && (
          <Card style={styles.crisisCard}>
            <Ionicons name="heart" size={20} color={Colors.alertRed} />
            <Text style={styles.crisisTitle}>You don't have to carry this alone.</Text>
            <Text style={styles.crisisBody}>
              Please reach out right now — someone near you is ready to listen.
            </Text>
            {nearbyResources.filter(r => r.phone).slice(0, 3).map(r => (
              <TouchableOpacity
                key={r.id}
                style={styles.crisisBtn}
                onPress={() => Linking.openURL(`tel:${r.phone!.replace(/\s/g, '')}`)}
                accessibilityLabel={`Call ${r.name}`}
              >
                <Ionicons name="call-outline" size={16} color={Colors.white} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.crisisBtnText}>{r.name}</Text>
                  <Text style={[styles.crisisBtnText, { fontSize: 12, opacity: 0.8 }]}>{r.phone}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {nearbyResources.filter(r => r.phone).length === 0 && (
              <TouchableOpacity
                style={styles.crisisBtn}
                onPress={() => router.push('/emergency' as any)}
                accessibilityLabel="Open emergency screen"
              >
                <Ionicons name="shield-outline" size={16} color={Colors.white} />
                <Text style={styles.crisisBtnText}>Open emergency support</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.crisisNote}>
              You can continue the check-in whenever you're ready.
            </Text>
          </Card>
        )}

        <Button
          label={step === totalSteps ? 'See my results' : 'Next'}
          onPress={handleNext}
          style={styles.nextBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Result states ────────────────────────────────────────────────────────────

function GreenState() {
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.softGreen }]}>
      <Ionicons name="checkmark-circle" size={44} color={Colors.softGreen} />
      <Text style={[styles.statusTitle, { color: Colors.softGreen }]}>You seem to be in a safe place.</Text>
      <Text style={styles.statusBody}>
        That's good to hear. HomeWithin is here whenever you want connection, healing, or someone to talk to — on your own timeline.
      </Text>
    </Card>
  );
}

function YellowState() {
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.safetyYellow }]}>
      <Ionicons name="alert-circle" size={44} color={Colors.safetyYellow} />
      <Text style={[styles.statusTitle, { color: '#7A5E00' }]}>Some things are weighing on you.</Text>
      <Text style={styles.statusBody}>
        What you're going through is real and it makes sense that it's heavy. Reaching out to a peer, writing in your journal, or reading a resource can help right now. You don't have to figure it all out today.
      </Text>
      <View style={styles.yellowActions}>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/(tabs)/connect' as any)}>
          <Ionicons name="people-outline" size={18} color={Colors.safeBlue} />
          <Text style={styles.yellowActionText}>Talk to a peer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/ai-companion' as any)}>
          <Ionicons name="sparkles-outline" size={18} color={Colors.mutedLavender} />
          <Text style={styles.yellowActionText}>AI companion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/(tabs)/resources' as any)}>
          <Ionicons name="book-outline" size={18} color={Colors.softGreen} />
          <Text style={styles.yellowActionText}>Resources</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function RedState({
  nearbyCounty,
  nearbyResources,
}: {
  nearbyCounty: string | null;
  nearbyResources: LocalResource[];
}) {
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.alertRed }]}>
      <Ionicons name="heart" size={44} color={Colors.alertRed} />
      <Text style={[styles.statusTitle, { color: Colors.alertRed }]}>You need support right now.</Text>
      <Text style={styles.statusBody}>
        What you're carrying is too much to carry alone. This is not your fault. Please reach out — someone is ready to listen, right now, with no judgment.
      </Text>

      <TouchableOpacity onPress={() => router.push('/emergency' as any)} style={styles.emergencyLink}>
        <Ionicons name="shield-outline" size={15} color={Colors.alertRed} />
        <Text style={styles.emergencyLinkText}>Open emergency screen</Text>
      </TouchableOpacity>

      {/* Local help centers — auto-populated from location detected on startup */}
      <View style={styles.localHelpDivider} />
      <View style={styles.localHelpHeader}>
        <Ionicons name="location-outline" size={18} color={Colors.safeBlue} />
        <Text style={styles.localHelpTitle}>Local help centers near you</Text>
      </View>

      {nearbyCounty && nearbyResources.length > 0 ? (
        <>
          <Text style={styles.localHelpCounty}>{nearbyCounty}</Text>
          {nearbyResources.map((r) => (
            <View key={r.id} style={styles.resourceRow}>
              <View style={[styles.resourceBadge, { backgroundColor: LOCAL_RESOURCE_TYPE_COLORS[r.type] + '18' }]}>
                <Ionicons
                  name={LOCAL_RESOURCE_TYPE_ICONS[r.type] as IoniconsName}
                  size={14}
                  color={LOCAL_RESOURCE_TYPE_COLORS[r.type]}
                />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceName}>{r.name}</Text>
                <Text style={styles.resourceType}>{LOCAL_RESOURCE_TYPE_LABELS[r.type]}</Text>
              </View>
              <View style={styles.resourceActions}>
                {r.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${r.phone!.replace(/\s/g, '')}`)}
                    accessibilityLabel={`Call ${r.name}`}
                    style={styles.resourceActionBtn}
                  >
                    <Ionicons name="call-outline" size={18} color={Colors.safeBlue} />
                  </TouchableOpacity>
                )}
                {r.website && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(r.website!)}
                    accessibilityLabel={`Visit ${r.name} website`}
                    style={styles.resourceActionBtn}
                  >
                    <Ionicons name="globe-outline" size={18} color={Colors.safeBlue} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <TouchableOpacity
            testID="see-all-resources-btn"
            style={styles.seeAllBtn}
            onPress={() => router.push('/local-resources' as any)}
          >
            <Text style={styles.seeAllText}>See all resources in {nearbyCounty}</Text>
            <Ionicons name="arrow-forward-outline" size={14} color={Colors.safeBlue} />
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.localHelpDesc}>
          Allow location access so we can show help centers near you.
        </Text>
      )}
    </Card>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },

  // Intro
  introHeader: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  introIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.safeBlue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  introTitle: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  introSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 23 },
  stepPreview: { gap: Spacing.sm },
  stepPreviewItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 6 },
  stepPreviewIcon: {
    width: 36, height: 36, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepPreviewNum: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  stepPreviewTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  beginBtn: {},
  skipLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipLinkText: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'underline' },

  // Progress bar
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, minWidth: 28 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.safeBlue },
  progressLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', minWidth: 28, textAlign: 'right' },

  // Step header
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
  },
  stepIconBg: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNum: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  stepSubtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },

  sliderCard: { backgroundColor: Colors.white },

  // Questions
  questions: { gap: Spacing.sm },
  question: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: Spacing.sm,
  },
  qIconBg: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  qBody: { flex: 1, gap: 3 },
  qLabel: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  qSublabel: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 4,
  },
  nextBtn: {},

  // Crisis interrupt
  crisisCard: {
    backgroundColor: Colors.alertRed + '08',
    borderWidth: 1.5,
    borderColor: Colors.alertRed + '44',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  crisisTitle: { fontSize: 16, fontWeight: '700', color: Colors.alertRed },
  crisisBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  crisisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.alertRed,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: '100%',
  },
  crisisBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.alertRed,
  },
  crisisBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white, flex: 1 },
  crisisNote: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', width: '100%' },

  // Results
  statusCard: {
    borderWidth: 2, backgroundColor: Colors.white,
    alignItems: 'center', gap: Spacing.sm,
  },
  statusTitle: { fontSize: 19, fontWeight: '700', textAlign: 'center' },
  statusBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  yellowActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center', marginTop: Spacing.xs },
  yellowAction: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.softGray, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  yellowActionText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  hotlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.alertRed,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    width: '100%',
  },
  hotlineName: { fontSize: 12, fontWeight: '600', color: Colors.white },
  hotlineNumber: { fontSize: 15, fontWeight: '700', color: Colors.white },

  emergencyLink: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.xs,
  },
  emergencyLinkText: { fontSize: 14, color: Colors.alertRed, textDecorationLine: 'underline' },

  // Safety plan
  planCard: { backgroundColor: Colors.white, gap: Spacing.sm },
  planTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  planHint: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  planRow: { gap: 4 },
  planPrompt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  planInput: {
    backgroundColor: Colors.softGray, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  homeBtn: {},

  // Local help centers
  localHelpCard: { gap: Spacing.sm },
  localHelpDivider: {
    height: 1, backgroundColor: Colors.alertRed + '30',
    marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  localHelpHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  localHelpTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  localHelpDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  localHelpCounty: { fontSize: 13, color: Colors.safeBlue, fontWeight: '600', marginBottom: 4 },
  resourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  resourceBadge: {
    width: 34, height: 34, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  resourceInfo: { flex: 1 },
  resourceName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  resourceType: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  resourceActions: { flexDirection: 'row', gap: 6 },
  resourceActionBtn: { padding: 4 },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    justifyContent: 'flex-end', paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  seeAllText: { fontSize: 13, color: Colors.safeBlue, fontWeight: '600' },
});

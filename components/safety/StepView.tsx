import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SafetySlider } from '@/components/ui/SafetySlider';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import type { SafetyAnswers } from '@/types';
import type { LocalResource } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { IoniconsName, Step } from './safetyData';

interface StepViewProps {
  step: number;
  totalSteps: number;
  currentStep: Step;
  answers: SafetyAnswers;
  moodScore: number;
  crisisInterrupt: boolean;
  skipAttempted: boolean;
  nearbyResources: LocalResource[];
  onToggleAnswer: (id: keyof SafetyAnswers) => void;
  onMoodChange: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepView({
  step,
  totalSteps,
  currentStep,
  answers,
  moodScore,
  crisisInterrupt,
  skipAttempted,
  nearbyResources,
  onToggleAnswer,
  onMoodChange,
  onNext,
  onBack,
}: StepViewProps) {
  const isLastStep = step === totalSteps;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressWrap}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{step}/{totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
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

        {currentStep.hasSlider && (
          <Card style={styles.sliderCard}>
            <SafetySlider
              label="How safe do you feel right now?"
              minLabel="Not safe"
              maxLabel="Completely safe"
              value={moodScore}
              onValueChange={onMoodChange}
              minimumValue={1}
              maximumValue={10}
            />
          </Card>
        )}

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
                onPress={() => onToggleAnswer(q.id)}
                activeOpacity={0.75}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={q.label}
              >
                <View style={[styles.qIconBg, { backgroundColor: activeColor + '18' }]}>
                  <Ionicons name={q.icon} size={18} color={checked ? activeColor : Colors.textMuted} />
                </View>
                <View style={styles.qBody}>
                  <Text style={[styles.qLabel, checked && { color: activeColor, fontWeight: '600' }]}>
                    {q.label}
                  </Text>
                  {q.sublabel && <Text style={styles.qSublabel}>{q.sublabel}</Text>}
                </View>
                <View style={[styles.checkbox, checked && { backgroundColor: activeColor, borderColor: activeColor }]}>
                  {checked && <Ionicons name="checkmark" size={13} color={Colors.white} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {crisisInterrupt && (
          <CrisisInterrupt nearbyResources={nearbyResources} />
        )}

        {skipAttempted && (
          <Text style={styles.skipHint}>
            Nothing applies here? Tap "{isLastStep ? 'See my results' : 'Next'}" again to skip this step.
          </Text>
        )}

        <Button label={isLastStep ? 'See my results' : 'Next'} onPress={onNext} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CrisisInterrupt({ nearbyResources }: { nearbyResources: LocalResource[] }) {
  const phonedResources = nearbyResources.filter((r) => r.phone).slice(0, 3);
  return (
    <Card style={styles.crisisCard}>
      <Ionicons name="heart" size={20} color={Colors.alertRed} />
      <Text style={styles.crisisTitle}>You don't have to carry this alone.</Text>
      <Text style={styles.crisisBody}>
        Please reach out right now — someone near you is ready to listen.
      </Text>
      {phonedResources.length > 0 ? (
        phonedResources.map((r) => (
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
        ))
      ) : (
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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },

  progressWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, minWidth: 28 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.safeBlue },
  progressLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', minWidth: 28, textAlign: 'right' },

  stepHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderLeftWidth: 3, paddingLeft: Spacing.md,
  },
  stepIconBg: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNum: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  stepSubtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  sliderCard: { backgroundColor: Colors.white },

  questions: { gap: Spacing.sm },
  question: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.softGray, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1.5, borderColor: 'transparent', gap: Spacing.sm,
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
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4,
  },

  crisisCard: {
    backgroundColor: Colors.alertRed + '08',
    borderWidth: 1.5, borderColor: Colors.alertRed + '44',
    gap: Spacing.sm, alignItems: 'flex-start',
  },
  crisisTitle: { fontSize: 16, fontWeight: '700', color: Colors.alertRed },
  crisisBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  crisisBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.alertRed, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, width: '100%',
  },
  crisisBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white, flex: 1 },
  crisisNote: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', width: '100%' },

  skipHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19, paddingHorizontal: Spacing.sm },
});

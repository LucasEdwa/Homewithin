import IntroView from '@/components/safety/IntroView';
import ResultsView from '@/components/safety/ResultsView';
import { PLAN_PROMPTS, STEPS } from '@/components/safety/safetyData';
import StepView from '@/components/safety/StepView';
import { useSession } from '@/context/SessionContext';
import { saveSafetyPlan } from '@/services/storage';
import { computeSafetyScore } from '@/services/wellness/safetyScore';
import type { SafetyAnswers, SafetyStatus } from '@/types';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export default function SafetyScreen() {
  const { t } = useTranslation();
  const { setSafetyLevel, nearbyState, nearbyResources } = useSession();
  const [step, setStep] = useState(0);
  const [moodScore, setMoodScore] = useState(8);
  const [answers, setAnswers] = useState<SafetyAnswers>({});
  const [safetyPlanLines, setSafetyPlanLines] = useState<string[]>(PLAN_PROMPTS.map(() => ''));
  const [assessed, setAssessed] = useState(false);
  const [status, setStatus] = useState<SafetyStatus>('green');
  const [crisisInterrupt, setCrisisInterrupt] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [stepInteracted, setStepInteracted] = useState(false);
  const [skipAttempted, setSkipAttempted] = useState(false);

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step - 1];

  function toggleAnswer(id: keyof SafetyAnswers) {
    const next = { ...answers, [id]: !answers[id] };
    setAnswers(next);
    setStepInteracted(true);
    setSkipAttempted(false);
    if ((id === 'self_harm_thoughts' || id === 'currently_in_danger') && !answers[id]) {
      setCrisisInterrupt(true);
    } else if ((id === 'self_harm_thoughts' || id === 'currently_in_danger') && answers[id]) {
      setCrisisInterrupt(false);
    }
  }

  function handleNext() {
    if (!stepInteracted && !skipAttempted) {
      setSkipAttempted(true);
      return;
    }
    setStepInteracted(false);
    setSkipAttempted(false);
    if (step < totalSteps) {
      setStep((s) => s + 1);
      setCrisisInterrupt(false);
    } else {
      const computed = computeSafetyScore(moodScore, answers);
      setStatus(computed);
      setSafetyLevel(computed);
      setAssessed(true);
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((s) => s - 1);
      setCrisisInterrupt(false);
      setStepInteracted(false);
      setSkipAttempted(false);
    }
  }

  async function handleSavePlan() {
    const steps = safetyPlanLines
      .map((line, i) => (line.trim() ? `${PLAN_PROMPTS[i]} ${line.trim()}` : null))
      .filter(Boolean) as string[];
    if (steps.length === 0) return;
    setSavingPlan(true);
    await saveSafetyPlan(steps);
    setSavingPlan(false);
    Alert.alert(t('safetyAssessment.saved'), t('safetyAssessment.savedBody'));
  }

  if (step === 0) {
    return (
      <IntroView
        steps={STEPS}
        onBegin={() => setStep(1)}
        onSkip={() => router.replace('/(tabs)')}
      />
    );
  }

  if (assessed) {
    return (
      <ResultsView
        status={status}
        safetyPlanLines={safetyPlanLines}
        onPlanLineChange={(i, v) => {
          const next = [...safetyPlanLines];
          next[i] = v;
          setSafetyPlanLines(next);
        }}
        onSavePlan={handleSavePlan}
        savingPlan={savingPlan}
        nearbyState={nearbyState}
        nearbyResources={nearbyResources}
        onGoHome={() => router.replace('/(tabs)')}
      />
    );
  }

  return (
    <StepView
      step={step}
      totalSteps={totalSteps}
      currentStep={currentStep}
      answers={answers}
      moodScore={moodScore}
      crisisInterrupt={crisisInterrupt}
      skipAttempted={skipAttempted && !stepInteracted}
      nearbyResources={nearbyResources}
      onToggleAnswer={toggleAnswer}
      onMoodChange={(v) => { setMoodScore(v); setStepInteracted(true); setSkipAttempted(false); }}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}

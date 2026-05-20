import type { SafetyAnswers, SafetyStatus } from '@/types/wellness';

export type { SafetyAnswers, SafetyStatus };

export function computeSafetyScore(
  moodScore: number,
  answers: SafetyAnswers,
): SafetyStatus {
  // Auto-red: immediate crisis signals — skip scoring entirely
  if (answers.self_harm_thoughts || answers.currently_in_danger) return "red";

  let risk = 0;

  // Mood (1–10): low mood adds weight
  if (moodScore <= 3) risk += 3;
  else if (moodScore <= 5) risk += 2;
  else if (moodScore <= 7) risk += 1;

  // High-weight risk factors
  if (answers.physical_abuse) risk += 4;
  if (answers.housing_unstable) risk += 3;
  if (answers.emotional_control) risk += 2;
  if (answers.hopelessness) risk += 2;

  // LGBTQ+-specific pressures
  if (answers.conversion_pressure) risk += 2;
  if (answers.outed_recently) risk += 2;

  // School & community
  if (answers.bullied_at_school) risk += 2;
  if (answers.community_hostility) risk += 2;
  if (answers.unsafe_outside_home) risk += 1;

  // Compound: bullying + community hostility = isolation risk
  if (answers.bullied_at_school && answers.community_hostility) risk += 1;

  // Surveillance
  if (answers.phone_surveillance) risk += 1;

  // Compound: physical abuse + unstable housing = much higher danger
  if (answers.physical_abuse && answers.housing_unstable) risk += 2;

  // Protective factors
  if (answers.trusted_contact) risk -= 2;
  if (answers.safe_place) risk -= 1;
  if (answers.basic_needs_met) risk -= 1;

  if (risk >= 5) return "red";
  if (risk >= 2) return "yellow";
  return "green";
}

export function hasCrisisSignal(answers: SafetyAnswers): boolean {
  return !!(answers.self_harm_thoughts || answers.currently_in_danger);
}

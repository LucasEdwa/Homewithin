export type SafetyStatus = 'green' | 'yellow' | 'red';

export interface SafetyAnswers {
  lives_with_family?: boolean;
  phone_access_risk?: boolean;
  currently_in_danger?: boolean;
  trusted_contact?: boolean;
}

export function computeSafetyScore(moodScore: number, answers: SafetyAnswers): SafetyStatus {
  let risk = 0;

  // Mood score contribution (1–10 scale)
  if (moodScore <= 3) risk += 3;
  else if (moodScore <= 6) risk += 1;

  // Danger signals
  if (answers.currently_in_danger) risk += 4;
  if (answers.phone_access_risk) risk += 1;

  // Compound risk: living with family AND in danger
  if (answers.lives_with_family && answers.currently_in_danger) risk += 1;

  // Protective factor
  if (answers.trusted_contact) risk -= 1;

  if (risk >= 4) return 'red';
  if (risk >= 1) return 'yellow';
  return 'green';
}

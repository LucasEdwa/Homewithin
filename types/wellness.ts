import type { MoodLevel, TriggerTag, EmotionTag } from './ui';

export interface CheckIn {
  id?: string;
  date: string; // YYYY-MM-DD
  moodScore: MoodLevel;
  anxietyScore: number; // 1–10
  lonelinessScore: number; // 1–10
  safetyScore: number; // 1–10
  hardestThing: string;
  tags: TriggerTag[];
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  body: string;
  emotionTags: EmotionTag[];
  moodTag?: string;
  isHidden: boolean;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  body: string;
  createdAt: string;
}

export interface MoodDataPoint {
  date: string;
  mood: number;
  safety: number;
}

export interface ProgressSnapshot {
  moodTrend: MoodDataPoint[];
  journalStreak: number;
  safetyDelta: number | null;
  connectionsCount: number;
  lessonsCompleted: number;
  totalLessons: number;
  profileCompletion: number;
  onboardingBadge: boolean;
}

export type SafetyStatus = 'green' | 'yellow' | 'red';

export interface SafetyAnswers {
  currently_in_danger?: boolean;
  physical_abuse?: boolean;
  emotional_control?: boolean;
  housing_unstable?: boolean;
  conversion_pressure?: boolean;
  outed_recently?: boolean;
  phone_surveillance?: boolean;
  bullied_at_school?: boolean;
  community_hostility?: boolean;
  unsafe_outside_home?: boolean;
  self_harm_thoughts?: boolean;
  hopelessness?: boolean;
  trusted_contact?: boolean;
  safe_place?: boolean;
  basic_needs_met?: boolean;
}

import { Colors } from '@/constants/Colors';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export const MOOD_ICONS = {
  1: 'sad' as const,
  2: 'sad-outline' as const,
  3: 'remove-circle-outline' as const,
  4: 'happy-outline' as const,
  5: 'happy' as const,
};

export const MOOD_COLORS: Record<MoodLevel, string> = {
  1: Colors.alertRed,
  2: '#E8844E',
  3: '#E8C44E',
  4: Colors.softGreen,
  5: Colors.safeBlue,
};

export const TRIGGER_TAGS = ['family', 'work', 'identity', 'loneliness', 'fear', 'hope'] as const;
export type TriggerTag = typeof TRIGGER_TAGS[number];

export const EMOTION_TAGS = ['fear', 'shame', 'hope', 'anger', 'relief'] as const;
export type EmotionTag = typeof EMOTION_TAGS[number];

export const EMOTION_COLORS: Record<EmotionTag, string> = {
  fear: '#E8844E',
  shame: Colors.mutedLavender,
  hope: Colors.softGreen,
  anger: Colors.alertRed,
  relief: Colors.safeBlue,
};

export interface CheckIn {
  id: string;
  date: string;        // YYYY-MM-DD
  moodScore: MoodLevel;
  anxietyScore: number;    // 1–10
  lonelinessScore: number; // 1–10
  safetyScore: number;     // 1–10
  hardestThing: string;
  tags: TriggerTag[];
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  body: string;
  emotionTags: EmotionTag[];
  moodTag?: string;
  isHidden: boolean;
  createdAt: string;
}

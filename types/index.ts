import { Colors } from "@/constants/Colors";

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: "Terrible",
  2: "Bad",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export const MOOD_ICONS = {
  1: "sad" as const,
  2: "sad-outline" as const,
  3: "remove-circle-outline" as const,
  4: "happy-outline" as const,
  5: "happy" as const,
};

export const MOOD_COLORS: Record<MoodLevel, string> = {
  1: Colors.alertRed,
  2: "#E8844E",
  3: "#E8C44E",
  4: Colors.softGreen,
  5: Colors.safeBlue,
};

export const TRIGGER_TAGS = [
  "family",
  "work",
  "identity",
  "loneliness",
  "fear",
  "hope",
] as const;
export type TriggerTag = (typeof TRIGGER_TAGS)[number];

export const EMOTION_TAGS = [
  "fear",
  "shame",
  "hope",
  "anger",
  "relief",
] as const;
export type EmotionTag = (typeof EMOTION_TAGS)[number];

export const EMOTION_COLORS: Record<EmotionTag, string> = {
  fear: "#E8844E",
  shame: Colors.mutedLavender,
  hope: Colors.softGreen,
  anger: Colors.alertRed,
  relief: Colors.safeBlue,
};

export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  moodScore: MoodLevel;
  anxietyScore: number; // 1–10
  lonelinessScore: number; // 1–10
  safetyScore: number; // 1–10
  hardestThing: string;
  tags: TriggerTag[];
  createdAt: string;
}

// ─── Resources ────────────────────────────────────────────────────────────────

export const RESOURCE_CATEGORY_IDS = [
  "family_rejection",
  "internalized_shame",
  "religious_trauma",
  "boundaries",
  "coming_out_safely",
  "crisis_help",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORY_IDS)[number];

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  family_rejection: "Family rejection",
  internalized_shame: "Internalized shame",
  religious_trauma: "Religious trauma",
  boundaries: "Boundaries",
  coming_out_safely: "Coming out safely",
  crisis_help: "Crisis help",
};

export const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  family_rejection: "#9b4e4b",
  internalized_shame: "#a8e3d3",
  religious_trauma: "#E8844E",
  boundaries: "#7BC9A7",
  coming_out_safely: "#5B8DEF",
  crisis_help: "#D9534F",
};

export interface Resource {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: ResourceCategory;
  language: string;
  readTime: number; // minutes
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

import type { UserProfile } from '@/context/SessionContext';
import { SEED_PROGRAMS } from '@/constants/programs';
import { getMyMatches } from './matching';
import { getCompletedLessonIds } from './programs';
import { getCheckIns, getJournalEntries } from './storage';

export interface MoodDataPoint {
  date: string;
  mood: number;
  safety: number;
}

export interface ProgressSnapshot {
  moodTrend: MoodDataPoint[];
  journalStreak: number;
  safetyDelta: number | null; // positive = improved, negative = declined
  connectionsCount: number;
  lessonsCompleted: number;
  totalLessons: number;
  profileCompletion: number; // 0–100
  onboardingBadge: boolean;
}

// ── Mood trend (last N days) ──────────────────────────────────────────────────

export async function getMoodTrend(days = 30): Promise<MoodDataPoint[]> {
  const all = await getCheckIns();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return all
    .filter((c) => c.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => ({ date: c.date, mood: c.moodScore, safety: c.safetyScore }));
}

// ── Journal streak (consecutive days up to today) ─────────────────────────────

export async function getJournalStreak(): Promise<number> {
  const entries = await getJournalEntries();
  if (entries.length === 0) return 0;

  const dates = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().split('T')[0];
    if (!dates.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ── Safety delta: avg last 7 days vs prior 7 days ────────────────────────────

export async function getSafetyDelta(): Promise<number | null> {
  const all = await getCheckIns();
  if (all.length < 2) return null;

  const today = new Date();
  const recent: number[] = [];
  const prior: number[] = [];

  all.forEach((c) => {
    const daysAgo = Math.floor(
      (today.getTime() - new Date(c.date).getTime()) / 86_400_000
    );
    if (daysAgo < 7) recent.push(c.safetyScore);
    else if (daysAgo < 14) prior.push(c.safetyScore);
  });

  if (recent.length === 0 || prior.length === 0) return null;

  const avg = (arr: number[]) => arr.reduce((s, n) => s + n, 0) / arr.length;
  return parseFloat((avg(recent) - avg(prior)).toFixed(1));
}

// ── Profile completion score (0–100) ─────────────────────────────────────────

const PROFILE_FIELDS: (keyof UserProfile)[] = [
  'nickname',
  'country',
  'language',
  'ageRange',
  'needs',
  'intentions',
];

export function getProfileCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;
  let filled = 0;
  for (const field of PROFILE_FIELDS) {
    const val = profile[field];
    if (Array.isArray(val) ? val.length > 0 : Boolean(val)) filled++;
  }
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

// ── Full snapshot ─────────────────────────────────────────────────────────────

export async function getProgressSnapshot(
  profile: UserProfile | null
): Promise<ProgressSnapshot> {
  const [moodTrend, journalStreak, safetyDelta, matches, completedIds] =
    await Promise.all([
      getMoodTrend(30),
      getJournalStreak(),
      getSafetyDelta(),
      getMyMatches().catch(() => []),
      getCompletedLessonIds().catch(() => new Set<string>()),
    ]);

  const totalLessons = SEED_PROGRAMS.reduce((s, p) => s + p.lessons.length, 0);
  const lessonsCompleted = completedIds.size;

  const profileCompletion = getProfileCompletion(profile);

  return {
    moodTrend,
    journalStreak,
    safetyDelta,
    connectionsCount: matches.length,
    lessonsCompleted,
    totalLessons,
    profileCompletion,
    onboardingBadge: profileCompletion === 100,
  };
}

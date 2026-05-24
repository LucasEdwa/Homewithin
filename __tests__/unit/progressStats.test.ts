import * as SecureStore from 'expo-secure-store';

import {
  getMoodTrend,
  getJournalStreak,
  getSafetyDelta,
  getProfileCompletion,
  getProgressSnapshot,
} from '@/services/wellness/progressStats';
import type { UserProfile } from '@/context/SessionContext';

jest.mock('expo-secure-store');
jest.mock('@/services/supabase', () => ({ supabase: null }));
jest.mock('@/services/social/matching', () => ({
  getMyMatches: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/data/programs', () => ({
  SEED_PROGRAMS: [
    {
      id: 'p1',
      title: 'Program 1',
      lessons: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }],
    },
  ],
}));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;
const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  mockStore.getItemAsync.mockImplementation(async (key) => store[key] ?? null);
  mockStore.setItemAsync.mockImplementation(async (key, value) => { store[key] = value; });
  mockStore.deleteItemAsync.mockImplementation(async (key) => { delete store[key]; });
});

// ── helpers ───────────────────────────────────────────────────────────────────

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

async function seedCheckIn(daysAgo: number, mood: number, safety: number) {
  const date = dateStr(daysAgo);
  const entry = {
    id: `ci-${daysAgo}`,
    date,
    moodScore: mood,
    anxietyScore: 5,
    lonelinessScore: 5,
    safetyScore: safety,
    hardestThing: '',
    tags: [],
    createdAt: new Date().toISOString(),
  };
  const dates: string[] = JSON.parse(store['hw_checkin_dates'] ?? '[]');
  if (!dates.includes(date)) {
    store['hw_checkin_dates'] = JSON.stringify([date, ...dates]);
  }
  store[`hw_checkin_${date}`] = JSON.stringify(entry);
}

async function seedJournalEntry(daysAgo: number) {
  const date = dateStr(daysAgo);
  const id = `j-${daysAgo}`;
  const entry = {
    id,
    date,
    body: 'test entry',
    emotionTags: [],
    isHidden: false,
    createdAt: new Date().toISOString(),
  };
  const ids: string[] = JSON.parse(store['hw_journal_ids'] ?? '[]');
  if (!ids.includes(id)) {
    store['hw_journal_ids'] = JSON.stringify([id, ...ids]);
  }
  store[`hw_journal_${id}`] = JSON.stringify(entry);
}

// ── getMoodTrend ──────────────────────────────────────────────────────────────

describe('getMoodTrend', () => {
  it('returns empty array when no check-ins', async () => {
    expect(await getMoodTrend()).toEqual([]);
  });

  it('returns check-ins within the window', async () => {
    await seedCheckIn(0, 4, 8);
    await seedCheckIn(5, 3, 6);
    await seedCheckIn(35, 2, 4); // outside 30-day window

    const trend = await getMoodTrend(30);
    expect(trend.length).toBe(2);
    expect(trend.every((p) => p.mood > 0)).toBe(true);
  });

  it('sorts points oldest first', async () => {
    await seedCheckIn(0, 4, 7);
    await seedCheckIn(3, 2, 5);
    const trend = await getMoodTrend(30);
    expect(trend[0].date < trend[1].date).toBe(true);
  });
});

// ── getJournalStreak ──────────────────────────────────────────────────────────

describe('getJournalStreak', () => {
  it('returns 0 when no entries', async () => {
    expect(await getJournalStreak()).toBe(0);
  });

  it('returns 1 for a single entry today', async () => {
    await seedJournalEntry(0);
    expect(await getJournalStreak()).toBe(1);
  });

  it('counts consecutive days', async () => {
    await seedJournalEntry(0);
    await seedJournalEntry(1);
    await seedJournalEntry(2);
    expect(await getJournalStreak()).toBe(3);
  });

  it('breaks streak on missing day', async () => {
    await seedJournalEntry(0);
    await seedJournalEntry(2); // gap at day 1
    expect(await getJournalStreak()).toBe(1);
  });
});

// ── getSafetyDelta ────────────────────────────────────────────────────────────

describe('getSafetyDelta', () => {
  it('returns null when insufficient data', async () => {
    await seedCheckIn(0, 3, 5);
    expect(await getSafetyDelta()).toBeNull();
  });

  it('returns positive delta when recent is better', async () => {
    await seedCheckIn(0, 4, 9);
    await seedCheckIn(1, 4, 8);
    await seedCheckIn(8, 3, 4);
    await seedCheckIn(9, 3, 3);
    const delta = await getSafetyDelta();
    expect(delta).not.toBeNull();
    expect(delta!).toBeGreaterThan(0);
  });

  it('returns negative delta when recent is worse', async () => {
    await seedCheckIn(0, 2, 3);
    await seedCheckIn(1, 2, 2);
    await seedCheckIn(8, 4, 9);
    await seedCheckIn(9, 4, 8);
    const delta = await getSafetyDelta();
    expect(delta).not.toBeNull();
    expect(delta!).toBeLessThan(0);
  });
});

// ── getProfileCompletion ──────────────────────────────────────────────────────

describe('getProfileCompletion', () => {
  const base: UserProfile = {
    nickname: 'Alex',
    pronouns: '',
    ageRange: '18–24',
    language: 'English',
    country: 'Brazil',
    hideFromSearch: false,
    needs: ['someone_to_talk'],
    intentions: ['listener'],
    isAnonymous: true,
  };

  it('returns 100 when all fields filled', () => {
    expect(getProfileCompletion(base)).toBe(100);
  });

  it('returns 0 for null profile', () => {
    expect(getProfileCompletion(null)).toBe(0);
  });

  it('reduces score for empty needs', () => {
    const p = { ...base, needs: [] };
    expect(getProfileCompletion(p)).toBeLessThan(100);
  });

  it('reduces score for missing country', () => {
    const p = { ...base, country: '' };
    expect(getProfileCompletion(p)).toBeLessThan(100);
  });
});

// ── getProgressSnapshot ───────────────────────────────────────────────────────

describe('getProgressSnapshot', () => {
  const profile: UserProfile = {
    nickname: 'Alex',
    pronouns: '',
    ageRange: '18–24',
    language: 'English',
    country: 'Brazil',
    hideFromSearch: false,
    needs: ['someone_to_talk'],
    intentions: ['listener'],
    isAnonymous: true,
  };

  it('returns a valid snapshot with defaults when no data', async () => {
    const snap = await getProgressSnapshot(profile);
    expect(snap.journalStreak).toBe(0);
    expect(snap.connectionsCount).toBe(0);
    expect(snap.moodTrend).toEqual([]);
    expect(snap.profileCompletion).toBe(100);
    expect(snap.onboardingBadge).toBe(true);
    expect(typeof snap.totalLessons).toBe('number');
    expect(snap.totalLessons).toBeGreaterThan(0);
  });

  it('reflects seeded journal streak', async () => {
    await seedJournalEntry(0);
    await seedJournalEntry(1);
    const snap = await getProgressSnapshot(profile);
    expect(snap.journalStreak).toBe(2);
  });
});

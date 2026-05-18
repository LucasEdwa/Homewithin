import * as SecureStore from 'expo-secure-store';
import {
  markOnboardingComplete,
  isOnboardingComplete,
  saveSession,
  getSession,
  saveSafetyPlan,
  getSafetyPlan,
  setPin,
  verifyPin,
  hasPin,
  deleteSensitiveData,
  saveCheckIn,
  getCheckIns,
  getTodayCheckIn,
  getRecentCheckIns,
  saveJournalEntry,
  getJournalEntries,
  deleteJournalEntry,
  exportJournalAsText,
} from '@/services/storage';
import type { CheckIn, JournalEntry } from '@/types';

// Access the in-memory store reset helper from our mock
const mockStore = SecureStore as any;

beforeEach(() => {
  mockStore.__reset?.();
  jest.clearAllMocks();
});

describe('onboarding flag', () => {
  it('returns false before marking complete', async () => {
    expect(await isOnboardingComplete()).toBe(false);
  });

  it('returns true after markOnboardingComplete', async () => {
    await markOnboardingComplete();
    expect(await isOnboardingComplete()).toBe(true);
  });

  it('calls setItemAsync with correct key', async () => {
    await markOnboardingComplete();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('hw_onboarding_complete', 'true');
  });
});

describe('session', () => {
  const profile = { nickname: 'River', pronouns: 'they/them', country: 'Brazil' };

  it('returns null when no session saved', async () => {
    expect(await getSession()).toBeNull();
  });

  it('saves and retrieves session data', async () => {
    await saveSession(profile);
    const retrieved = await getSession();
    expect(retrieved).toMatchObject(profile);
  });

  it('overwrites an existing session', async () => {
    await saveSession(profile);
    await saveSession({ nickname: 'Sage' });
    const retrieved = await getSession() as any;
    expect(retrieved.nickname).toBe('Sage');
  });
});

describe('safety plan', () => {
  it('returns empty array when no plan saved', async () => {
    expect(await getSafetyPlan()).toEqual([]);
  });

  it('saves and retrieves a safety plan', async () => {
    const steps = ['Text Alex', 'Go to library', 'Call helpline'];
    await saveSafetyPlan(steps);
    expect(await getSafetyPlan()).toEqual(steps);
  });

  it('handles an empty plan array', async () => {
    await saveSafetyPlan([]);
    expect(await getSafetyPlan()).toEqual([]);
  });
});

describe('PIN', () => {
  it('hasPin returns false with no PIN set', async () => {
    expect(await hasPin()).toBe(false);
  });

  it('hasPin returns true after setting a PIN', async () => {
    await setPin('1234');
    expect(await hasPin()).toBe(true);
  });

  it('verifyPin returns true for correct PIN', async () => {
    await setPin('5678');
    expect(await verifyPin('5678')).toBe(true);
  });

  it('verifyPin returns false for wrong PIN', async () => {
    await setPin('5678');
    expect(await verifyPin('0000')).toBe(false);
  });

  it('verifyPin returns false when no PIN is set', async () => {
    expect(await verifyPin('1234')).toBe(false);
  });
});

describe('deleteSensitiveData', () => {
  it('calls deleteItemAsync for safety plan and session keys', async () => {
    await deleteSensitiveData();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('hw_safety_plan');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('hw_session');
  });

  it('makes getSession return null after deletion', async () => {
    await saveSession({ nickname: 'River' });
    await deleteSensitiveData();
    expect(await getSession()).toBeNull();
  });
});

// ─── Check-ins ────────────────────────────────────────────────────────────────

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: 'ci-test',
    date: today,
    moodScore: 4,
    anxietyScore: 3,
    lonelinessScore: 5,
    safetyScore: 8,
    hardestThing: 'today was hard',
    tags: ['family'],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('check-ins', () => {
  it('getCheckIns returns empty array when none saved', async () => {
    expect(await getCheckIns()).toEqual([]);
  });

  it('saveCheckIn stores and getCheckIns retrieves it', async () => {
    const entry = makeCheckIn();
    await saveCheckIn(entry);
    const all = await getCheckIns();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(entry);
  });

  it('saving the same date twice keeps only one entry', async () => {
    const today = new Date().toISOString().split('T')[0];
    await saveCheckIn(makeCheckIn({ date: today, moodScore: 2 }));
    await saveCheckIn(makeCheckIn({ date: today, moodScore: 5 }));
    const all = await getCheckIns();
    expect(all).toHaveLength(1);
    expect(all[0].moodScore).toBe(5);
  });

  it('stores multiple check-ins for different dates', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    await saveCheckIn(makeCheckIn({ date: yesterday, id: 'ci-yesterday' }));
    await saveCheckIn(makeCheckIn({ date: today, id: 'ci-today' }));
    expect(await getCheckIns()).toHaveLength(2);
  });

  it('getTodayCheckIn returns null when not yet checked in', async () => {
    expect(await getTodayCheckIn()).toBeNull();
  });

  it('getTodayCheckIn returns today\'s entry', async () => {
    const today = new Date().toISOString().split('T')[0];
    const entry = makeCheckIn({ date: today });
    await saveCheckIn(entry);
    const result = await getTodayCheckIn();
    expect(result).toEqual(entry);
  });

  it('getRecentCheckIns(7) includes today', async () => {
    const entry = makeCheckIn();
    await saveCheckIn(entry);
    const recent = await getRecentCheckIns(7);
    expect(recent).toHaveLength(1);
    expect(recent[0].id).toBe(entry.id);
  });

  it('getRecentCheckIns excludes entries older than the window', async () => {
    const old = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
    await saveCheckIn(makeCheckIn({ date: old, id: 'old-ci' }));
    const recent = await getRecentCheckIns(7);
    expect(recent.find((c) => c.id === 'old-ci')).toBeUndefined();
  });

  it('deleteSensitiveData wipes check-ins', async () => {
    await saveCheckIn(makeCheckIn());
    await deleteSensitiveData();
    expect(await getCheckIns()).toEqual([]);
  });
});

// ─── Journal entries ──────────────────────────────────────────────────────────

function makeJournalEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'je-test',
    date: new Date().toISOString().split('T')[0],
    body: 'Today I felt something shift.',
    emotionTags: ['hope'],
    isHidden: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('journal entries', () => {
  it('getJournalEntries returns empty array when none saved', async () => {
    expect(await getJournalEntries()).toEqual([]);
  });

  it('saveJournalEntry stores and getJournalEntries retrieves it', async () => {
    const entry = makeJournalEntry();
    await saveJournalEntry(entry);
    const all = await getJournalEntries();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(entry);
  });

  it('stores multiple entries independently', async () => {
    await saveJournalEntry(makeJournalEntry({ id: 'je-1', createdAt: '2026-05-15T09:00:00Z' }));
    await saveJournalEntry(makeJournalEntry({ id: 'je-2', createdAt: '2026-05-16T09:00:00Z' }));
    expect(await getJournalEntries()).toHaveLength(2);
  });

  it('returns entries sorted by createdAt descending', async () => {
    await saveJournalEntry(makeJournalEntry({ id: 'je-a', createdAt: '2026-05-14T09:00:00Z' }));
    await saveJournalEntry(makeJournalEntry({ id: 'je-b', createdAt: '2026-05-16T09:00:00Z' }));
    await saveJournalEntry(makeJournalEntry({ id: 'je-c', createdAt: '2026-05-15T09:00:00Z' }));
    const all = await getJournalEntries();
    expect(all.map((e) => e.id)).toEqual(['je-b', 'je-c', 'je-a']);
  });

  it('deleteJournalEntry removes the entry', async () => {
    await saveJournalEntry(makeJournalEntry({ id: 'je-del' }));
    await deleteJournalEntry('je-del');
    const all = await getJournalEntries();
    expect(all.find((e) => e.id === 'je-del')).toBeUndefined();
  });

  it('deleteJournalEntry does not affect other entries', async () => {
    await saveJournalEntry(makeJournalEntry({ id: 'je-keep' }));
    await saveJournalEntry(makeJournalEntry({ id: 'je-remove' }));
    await deleteJournalEntry('je-remove');
    const all = await getJournalEntries();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('je-keep');
  });

  it('exportJournalAsText returns placeholder when empty', async () => {
    expect(await exportJournalAsText()).toBe('No journal entries yet.');
  });

  it('exportJournalAsText formats entries as readable text', async () => {
    const entry = makeJournalEntry({ date: '2026-05-16', body: 'A good day.', emotionTags: ['hope'] });
    await saveJournalEntry(entry);
    const text = await exportJournalAsText();
    expect(text).toContain('2026-05-16');
    expect(text).toContain('A good day.');
    expect(text).toContain('hope');
  });

  it('deleteSensitiveData wipes journal entries', async () => {
    await saveJournalEntry(makeJournalEntry());
    await deleteSensitiveData();
    expect(await getJournalEntries()).toEqual([]);
  });
});

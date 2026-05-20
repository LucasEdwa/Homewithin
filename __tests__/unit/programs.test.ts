import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');
jest.mock('@/services/supabase', () => ({ supabase: null, isSupabaseConfigured: false }));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  mockStore.getItemAsync.mockImplementation(async (key) => store[key] ?? null);
  mockStore.setItemAsync.mockImplementation(async (key, value) => { store[key] = value; });
  mockStore.deleteItemAsync.mockImplementation(async (key) => { delete store[key]; });
});

import {
  getPrograms,
  getProgramById,
  getCompletedLessonIds,
  markLessonComplete,
  getProgramProgress,
  getAllProgramsWithProgress,
} from '@/services/content/programs';
import { SEED_PROGRAMS as PROGRAMS } from '@/data/programs';

describe('getPrograms', () => {
  it('returns all 5 programs', async () => {
    const programs = await getPrograms();
    expect(programs).toHaveLength(5);
  });

  it('each program has at least 1 lesson', async () => {
    const programs = await getPrograms();
    programs.forEach((p) => expect(p.lessons.length).toBeGreaterThan(0));
  });
});

describe('getProgramById', () => {
  it('returns correct program', async () => {
    const p = await getProgramById('prog-001');
    expect(p).not.toBeNull();
    expect(p?.id).toBe('prog-001');
  });

  it('returns null for unknown id', async () => {
    const p = await getProgramById('prog-999');
    expect(p).toBeNull();
  });
});

describe('getCompletedLessonIds', () => {
  it('returns empty set when no progress stored', async () => {
    const ids = await getCompletedLessonIds();
    expect(ids.size).toBe(0);
  });
});

describe('markLessonComplete', () => {
  it('adds lesson to completed set', async () => {
    const program = PROGRAMS[0];
    const lesson = program.lessons[0];
    await markLessonComplete(lesson.id, program.id);
    const ids = await getCompletedLessonIds();
    expect(ids.has(lesson.id)).toBe(true);
  });

  it('is idempotent — marking twice keeps one entry', async () => {
    const program = PROGRAMS[0];
    const lesson = program.lessons[0];
    await markLessonComplete(lesson.id, program.id);
    await markLessonComplete(lesson.id, program.id);
    const ids = await getCompletedLessonIds();
    expect(ids.has(lesson.id)).toBe(true);
    // Only one entry per lesson
    const raw = await SecureStore.getItemAsync('hw_lesson_progress');
    const arr = JSON.parse(raw!);
    const count = arr.filter((e: any) => e.lessonId === lesson.id).length;
    expect(count).toBe(1);
  });

  it('tracks multiple lessons', async () => {
    const program = PROGRAMS[0];
    await markLessonComplete(program.lessons[0].id, program.id);
    await markLessonComplete(program.lessons[1].id, program.id);
    const ids = await getCompletedLessonIds();
    expect(ids.has(program.lessons[0].id)).toBe(true);
    expect(ids.has(program.lessons[1].id)).toBe(true);
  });
});

describe('getProgramProgress', () => {
  it('returns 0 completed when none marked', async () => {
    const { completed, total } = await getProgramProgress('prog-001');
    expect(completed).toBe(0);
    expect(total).toBe(PROGRAMS.find((p) => p.id === 'prog-001')!.lessons.length);
  });

  it('returns correct count after marking lessons', async () => {
    const program = PROGRAMS[0];
    await markLessonComplete(program.lessons[0].id, program.id);
    const { completed, total } = await getProgramProgress(program.id);
    expect(completed).toBe(1);
    expect(total).toBe(program.lessons.length);
  });
});

describe('getAllProgramsWithProgress', () => {
  it('returns array with completed and total fields', async () => {
    const results = await getAllProgramsWithProgress();
    expect(results).toHaveLength(5);
    results.forEach((r) => {
      expect(typeof r.completed).toBe('number');
      expect(typeof r.total).toBe('number');
      expect(r.total).toBeGreaterThan(0);
    });
  });

  it('reflects marked progress', async () => {
    const program = PROGRAMS[1];
    await markLessonComplete(program.lessons[0].id, program.id);
    const results = await getAllProgramsWithProgress();
    const found = results.find((r) => r.id === program.id)!;
    expect(found.completed).toBe(1);
  });
});

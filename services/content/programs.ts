import * as SecureStore from 'expo-secure-store';
import { supabase } from '../supabase';
import { SEED_PROGRAMS } from '@/data/programs';
import type { Program, LessonProgress } from '@/types';

const PROGRESS_KEY = 'hw_lesson_progress';

// ─── Local progress (SecureStore) ────────────────────────────────────────────

async function loadProgress(): Promise<LessonProgress[]> {
  const raw = await SecureStore.getItemAsync(PROGRESS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveProgress(progress: LessonProgress[]): Promise<void> {
  await SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(progress));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<Program[]> {
  return SEED_PROGRAMS;
}

export async function getProgramById(id: string): Promise<Program | null> {
  return SEED_PROGRAMS.find((p) => p.id === id) ?? null;
}

export async function getCompletedLessonIds(): Promise<Set<string>> {
  const progress = await loadProgress();
  return new Set(progress.map((p) => p.lessonId));
}

export async function markLessonComplete(lessonId: string, programId: string): Promise<void> {
  const progress = await loadProgress();
  if (progress.some((p) => p.lessonId === lessonId)) return;

  const entry: LessonProgress = {
    lessonId,
    programId,
    completedAt: new Date().toISOString(),
  };

  await saveProgress([...progress, entry]);

  // Sync to Supabase
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (user) {
      const { error } = await supabase.from('user_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        program_id: programId,
        completed_at: entry.completedAt,
      });
      if (error) console.error('Progress sync failed:', error.message);
    }
  }
}

export async function getProgramProgress(programId: string): Promise<{ completed: number; total: number }> {
  const program = SEED_PROGRAMS.find((p) => p.id === programId);
  if (!program) return { completed: 0, total: 0 };

  const completed = await getCompletedLessonIds();
  const completedCount = program.lessons.filter((l) => completed.has(l.id)).length;
  return { completed: completedCount, total: program.lessons.length };
}

export async function getAllProgramsWithProgress(): Promise<
  Array<Program & { completed: number; total: number }>
> {
  const completed = await getCompletedLessonIds();
  return SEED_PROGRAMS.map((program) => ({
    ...program,
    completed: program.lessons.filter((l) => completed.has(l.id)).length,
    total: program.lessons.length,
  }));
}

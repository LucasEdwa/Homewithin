import { SEED_PROGRAMS } from "@/data/programs";
import type { Lesson, LessonProgress, Program } from "@/types";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../supabase";

const PROGRESS_KEY = "hw_lesson_progress";

// ─── Local progress (SecureStore) ────────────────────────────────────────────

async function loadProgress(): Promise<LessonProgress[]> {
  const raw = await SecureStore.getItemAsync(PROGRESS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveProgress(progress: LessonProgress[]): Promise<void> {
  await SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(progress));
}

// ─── Supabase fetching (with local fallback) ──────────────────────────────────

type DbLesson = {
  id: string;
  program_id: string;
  sort_order: number;
  title: string;
  body: string;
  reflection_prompt: string;
  read_time: number;
};

type DbProgram = {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  sort_order: number;
  lessons: DbLesson[];
};

function normalizeLesson(l: DbLesson): Lesson {
  return {
    id: l.id,
    programId: l.program_id,
    order: l.sort_order,
    title: l.title,
    body: l.body,
    reflectionPrompt: l.reflection_prompt,
    readTime: l.read_time,
  };
}

function normalizeProgram(p: DbProgram): Program {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    color: p.color,
    icon: p.icon,
    lessons: (p.lessons ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(normalizeLesson),
  };
}

/** In-memory cache so Supabase is only hit once per app session. */
let programsCache: Program[] | null = null;

async function fetchFromSupabase(): Promise<Program[] | null> {
  if (!supabase) {
    console.warn("[programs] supabase client is null — using local fallback");
    return null;
  }
  try {
    const { data, error } = await supabase
      .from("programs")
      .select("*, lessons(*)")
      .order("sort_order");
    if (error) {
      console.warn("[programs] Supabase fetch error:", error.message);
      return null;
    }
    if (!data?.length) {
      console.warn("[programs] No programs in DB — using local fallback");
      return null;
    }
    return (data as DbProgram[]).map(normalizeProgram);
  } catch (e) {
    console.warn("[programs] Supabase fetch threw:", e);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<Program[]> {
  if (programsCache) return programsCache;
  const remote = await fetchFromSupabase();
  // Only cache on success — if Supabase fails, retry next call
  if (remote) {
    programsCache = remote;
    return remote;
  }
  return SEED_PROGRAMS;
}

export async function getProgramById(id: string): Promise<Program | null> {
  const programs = await getPrograms();
  return programs.find((p) => p.id === id) ?? null;
}

export async function getCompletedLessonIds(): Promise<Set<string>> {
  const progress = await loadProgress();
  return new Set(progress.map((p) => p.lessonId));
}

export async function markLessonComplete(
  lessonId: string,
  programId: string,
): Promise<void> {
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
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (user) {
      const { error } = await supabase.from("user_progress").upsert({
        user_id: user.id,
        lesson_id: lessonId,
        program_id: programId,
        completed_at: entry.completedAt,
      });
      if (error) console.error("Progress sync failed:", error.message);
    }
  }
}

export async function getProgramProgress(
  programId: string,
): Promise<{ completed: number; total: number }> {
  const program = await getProgramById(programId);
  if (!program) return { completed: 0, total: 0 };

  const completed = await getCompletedLessonIds();
  const completedCount = program.lessons.filter((l) =>
    completed.has(l.id),
  ).length;
  return { completed: completedCount, total: program.lessons.length };
}

export async function getAllProgramsWithProgress(): Promise<
  Array<Program & { completed: number; total: number }>
> {
  const [programs, completed] = await Promise.all([
    getPrograms(),
    getCompletedLessonIds(),
  ]);
  return programs.map((program) => ({
    ...program,
    completed: program.lessons.filter((l) => completed.has(l.id)).length,
    total: program.lessons.length,
  }));
}

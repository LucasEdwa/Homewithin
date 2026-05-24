#!/usr/bin/env node
/// <reference types="node" />
/**
 * Seed all programs and lessons into Supabase.
 *
 * Usage (from project root):
 *   npm run seed:programs
 *
 * Reads credentials from .env automatically.
 * The service role key bypasses RLS so it can run without a logged-in user.
 *
 * Run this once after applying the 20260524000000_programs_and_lessons migration.
 * It is safe to re-run — it uses upsert (ON CONFLICT DO UPDATE).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { SEED_PROGRAMS } from "../data/programs";

// Auto-load .env from project root (no extra packages needed)
try {
  const envPath = resolve(process.cwd(), ".env");
  readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    });
} catch {
  // No .env file — rely on environment variables already set
}

const url =
  process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !key) {
  console.error(
    "Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

async function seed() {
  console.log(`Seeding ${SEED_PROGRAMS.length} programs…`);

  for (const program of SEED_PROGRAMS) {
    // Upsert program row
    const { error: progErr } = await supabase.from("programs").upsert(
      {
        id: program.id,
        title: program.title,
        description: program.description,
        color: program.color,
        icon: program.icon,
        sort_order: SEED_PROGRAMS.indexOf(program),
      },
      { onConflict: "id" },
    );

    if (progErr) {
      console.error(`  ✗ program ${program.id}:`, progErr.message);
      continue;
    }
    console.log(`  ✓ program: ${program.title}`);

    // Upsert all lessons for this program
    const lessonRows = program.lessons.map((l) => ({
      id: l.id,
      program_id: l.programId,
      sort_order: l.order,
      title: l.title,
      body: l.body,
      reflection_prompt: l.reflectionPrompt,
      read_time: l.readTime,
    }));

    const { error: lessErr } = await supabase
      .from("lessons")
      .upsert(lessonRows, { onConflict: "id" });

    if (lessErr) {
      console.error(`  ✗ lessons for ${program.id}:`, lessErr.message);
    } else {
      console.log(`    ✓ ${lessonRows.length} lessons`);
    }
  }

  console.log("\nDone.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

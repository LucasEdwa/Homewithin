-- Sprint 6: Healing Programs & AI Companion
-- Programs and lessons are defined in constants/programs.ts (client-side).
-- This migration stores user progress and optional server-side lesson metadata.

-- ─── user_progress ────────────────────────────────────────────────────────────
create table if not exists user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    text not null,
  program_id   text not null,
  completed_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

alter table user_progress enable row level security;

create policy "Users manage own progress"
  on user_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on user_progress(user_id);
create index on user_progress(program_id);

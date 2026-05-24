-- HomeWithin — Create user_progress table
-- Tracks per-user lesson completion across all healing programs.
-- Program/lesson content is seeded via `npm run seed:programs` (see scripts/seed-programs.ts).

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

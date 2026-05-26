-- ─── Sprint: Programs & Lessons ──────────────────────────────────────────────
-- Moves healing program content from the static TS data file into the database
-- so programs and lessons can be updated without shipping a new app release.

create table if not exists programs (
  id          text primary key,
  title       text not null,
  description text not null,
  color       text not null default '#5B8DEF',
  icon        text not null default 'book-outline',
  sort_order  int  not null default 0,
  created_at  timestamptz default now()
);

alter table programs enable row level security;

drop policy if exists "Programs are publicly readable" on programs;
create policy "Programs are publicly readable"
  on programs for select
  using (true);

create table if not exists lessons (
  id                text primary key,
  program_id        text references programs(id) on delete cascade not null,
  sort_order        int  not null,
  title             text not null,
  body              text not null,
  reflection_prompt text not null default '',
  read_time         int  not null default 3,
  created_at        timestamptz default now()
);

alter table lessons enable row level security;

drop policy if exists "Lessons are publicly readable" on lessons;
create policy "Lessons are publicly readable"
  on lessons for select
  using (true);

create index if not exists lessons_program_id_order on lessons (program_id, sort_order);

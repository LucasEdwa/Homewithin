-- HomeWithin — Supabase schema
-- Run this in your Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

-- ─── Sprint 2: Check-ins ─────────────────────────────────────────────────────

create table if not exists check_ins (
  id           text primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  date         date not null,
  mood_score   int  not null check (mood_score between 1 and 5),
  anxiety_score     int not null check (anxiety_score between 1 and 10),
  loneliness_score  int not null check (loneliness_score between 1 and 10),
  safety_score      int not null check (safety_score between 1 and 10),
  hardest_thing     text default '',
  tags         text[] default '{}',
  created_at   timestamptz default now()
);

-- One check-in per user per day
create unique index if not exists check_ins_user_date on check_ins (user_id, date);

alter table check_ins enable row level security;

create policy "Users manage own check-ins"
  on check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Sprint 2: Journal entries ────────────────────────────────────────────────
-- Note: journal entries are stored locally by default (SecureStore) for privacy.
-- This table is only used if the user explicitly opts in to cloud backup (Sprint 3+).

create table if not exists journal_entries (
  id           text primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  date         date not null,
  body         text not null,
  emotion_tags text[] default '{}',
  mood_tag     text,
  is_hidden    boolean default false,
  created_at   timestamptz default now()
);

alter table journal_entries enable row level security;

create policy "Users manage own journal entries"
  on journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists check_ins_user_created on check_ins (user_id, created_at desc);
create index if not exists journal_entries_user_created on journal_entries (user_id, created_at desc);

-- HomeWithin — Create user_profiles, matches, and messages tables
-- user_profiles: public display info (nickname, country, needs, intentions).
-- matches: mutual-consent peer pairing system.
-- messages: real-time 1-to-1 chat between matched users.

-- ─── User public profiles ─────────────────────────────────────────────────────

create table if not exists user_profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  nickname         text not null,
  age_range        text,
  language         text default 'English',
  country          text,
  needs            text[] default '{}',
  hide_from_search boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table user_profiles enable row level security;

-- Users can read non-hidden profiles for matching
create policy "Public profiles are readable"
  on user_profiles for select
  using (hide_from_search = false or auth.uid() = user_id);

-- Users manage their own profile
create policy "Users manage own profile"
  on user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Matches ─────────────────────────────────────────────────────────────────

create table if not exists matches (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete cascade not null,
  target_id    uuid references auth.users(id) on delete cascade not null,
  intention    text not null,
  status       text not null default 'accepted' check (status in ('accepted', 'passed', 'blocked')),
  created_at   timestamptz default now(),
  unique (requester_id, target_id)
);

alter table matches enable row level security;

create policy "Users see own matches"
  on matches for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

create policy "Users create matches"
  on matches for insert
  with check (auth.uid() = requester_id);

create policy "Users update own matches"
  on matches for update
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- ─── Messages ────────────────────────────────────────────────────────────────

create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references matches(id) on delete cascade not null,
  sender_id  uuid references auth.users(id) on delete cascade not null,
  body       text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- Only participants of a match can see its messages
create policy "Match participants can read messages"
  on messages for select
  using (
    exists (
      select 1 from matches
      where matches.id = messages.match_id
        and (matches.requester_id = auth.uid() or matches.target_id = auth.uid())
    )
  );

create policy "Match participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from matches
      where matches.id = match_id
        and (matches.requester_id = auth.uid() or matches.target_id = auth.uid())
        and matches.status = 'accepted'
    )
  );

-- ─── Blocks ──────────────────────────────────────────────────────────────────

create table if not exists blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid references auth.users(id) on delete cascade not null,
  blocked_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (blocker_id, blocked_id)
);

alter table blocks enable row level security;

create policy "Users manage own blocks"
  on blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- ─── Reports ─────────────────────────────────────────────────────────────────

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reported_id uuid references auth.users(id),
  message_id  uuid references messages(id),
  reason      text not null,
  created_at  timestamptz default now()
);

alter table reports enable row level security;

create policy "Users create reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists matches_requester on matches (requester_id, status);
create index if not exists matches_target    on matches (target_id, status);
create index if not exists messages_match    on messages (match_id, created_at asc);
create index if not exists blocks_blocker    on blocks (blocker_id);
create index if not exists blocks_blocked    on blocks (blocked_id);

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable realtime for messages so the chat screen receives new messages live.
-- Run this separately in the Supabase dashboard if supabase_realtime is not
-- available in migration context:
--   alter publication supabase_realtime add table messages;

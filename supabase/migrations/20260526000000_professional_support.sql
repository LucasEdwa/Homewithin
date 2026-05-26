-- HomeWithin — Professional Support Beta
-- Adds: role column to user_profiles, professional_profiles,
--       professional_availability, professional_sessions,
--       session_messages, session_notes

-- ─── Role column on user_profiles ────────────────────────────────────────────

alter table user_profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'professional'));

-- ─── Professional Profiles ───────────────────────────────────────────────────

create table if not exists professional_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  display_name          text not null,
  title                 text not null,
  bio                   text not null default '',
  specialties           text[] not null default '{}',
  languages             text[] not null default '{}',
  license_number        text not null default '',
  license_verified      boolean not null default false,
  avatar_url            text,
  session_price_sek_ore int not null default 0
    check (session_price_sek_ore >= 0),
  is_active             boolean not null default true,
  created_at            timestamptz default now()
);

alter table professional_profiles enable row level security;

-- Anyone can discover active, verified professionals
drop policy if exists "Verified professionals are publicly readable" on professional_profiles;
create policy "Verified professionals are publicly readable"
  on professional_profiles for select
  using (is_active = true and license_verified = true);

-- Professionals manage their own profile
drop policy if exists "Professionals manage own profile" on professional_profiles;
create policy "Professionals manage own profile"
  on professional_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── Professional Availability ───────────────────────────────────────────────

create table if not exists professional_availability (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid not null references professional_profiles(id) on delete cascade,
  day_of_week       int not null check (day_of_week between 0 and 6),
  start_time        time not null,
  end_time          time not null,
  is_active         boolean not null default true,
  constraint availability_time_order check (end_time > start_time)
);

alter table professional_availability enable row level security;

-- Anyone can read availability of active professionals
drop policy if exists "Availability is publicly readable" on professional_availability;
create policy "Availability is publicly readable"
  on professional_availability for select
  using (is_active = true);

-- Professionals manage their own availability
drop policy if exists "Professionals manage own availability" on professional_availability;
create policy "Professionals manage own availability"
  on professional_availability for all
  using (auth.uid() = professional_id)
  with check (auth.uid() = professional_id);

-- ─── Professional Sessions (bookings) ────────────────────────────────────────

create table if not exists professional_sessions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  professional_id           uuid not null references professional_profiles(id) on delete cascade,
  scheduled_at              timestamptz not null,
  duration_minutes          int not null default 50 check (duration_minutes > 0),
  status                    text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  stripe_payment_intent_id  text,
  stripe_payment_status     text not null default 'unpaid'
    check (stripe_payment_status in ('unpaid', 'paid', 'refunded')),
  created_at                timestamptz default now(),
  -- prevent double-booking the same slot with the same professional
  unique (professional_id, scheduled_at)
);

create index if not exists idx_professional_sessions_user_id
  on professional_sessions(user_id);
create index if not exists idx_professional_sessions_professional_id
  on professional_sessions(professional_id);
create index if not exists idx_professional_sessions_scheduled_at
  on professional_sessions(scheduled_at);

alter table professional_sessions enable row level security;

-- Both the user and professional can read their shared sessions
drop policy if exists "Session participants can read sessions" on professional_sessions;
create policy "Session participants can read sessions"
  on professional_sessions for select
  using (auth.uid() = user_id or auth.uid() = professional_id);

-- Only the user can create a booking
drop policy if exists "Users create sessions" on professional_sessions;
create policy "Users create sessions"
  on professional_sessions for insert
  with check (auth.uid() = user_id);

-- Both participants can update (e.g. status changes, confirmation)
drop policy if exists "Session participants can update sessions" on professional_sessions;
create policy "Session participants can update sessions"
  on professional_sessions for update
  using (auth.uid() = user_id or auth.uid() = professional_id);

-- ─── Session Messages ────────────────────────────────────────────────────────

create table if not exists session_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references professional_sessions(id) on delete cascade,
  sender_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz default now()
);

create index if not exists idx_session_messages_session_id
  on session_messages(session_id, created_at);

alter table session_messages enable row level security;

-- Only participants of the parent session can read messages
drop policy if exists "Session participants can read messages" on session_messages;
create policy "Session participants can read messages"
  on session_messages for select
  using (
    exists (
      select 1 from professional_sessions ps
      where ps.id = session_id
        and (ps.user_id = auth.uid() or ps.professional_id = auth.uid())
    )
  );

-- Participants can send messages only when session is confirmed
drop policy if exists "Participants can send messages in confirmed sessions" on session_messages;
create policy "Participants can send messages in confirmed sessions"
  on session_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from professional_sessions ps
      where ps.id = session_id
        and (ps.user_id = auth.uid() or ps.professional_id = auth.uid())
        and ps.status = 'confirmed'
    )
  );

-- Enable realtime for session_messages
do $$ begin
  alter publication supabase_realtime add table session_messages;
exception when duplicate_object then null;
end $$;

-- ─── Session Notes ───────────────────────────────────────────────────────────

create table if not exists session_notes (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references professional_sessions(id) on delete cascade,
  professional_id   uuid not null references professional_profiles(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  body              text not null default '' check (char_length(body) <= 2000),
  is_shared_with_ai boolean not null default false,
  created_at        timestamptz default now(),
  unique (session_id) -- one note per session
);

alter table session_notes enable row level security;

-- Professional can fully manage their own notes
drop policy if exists "Professionals manage own session notes" on session_notes;
create policy "Professionals manage own session notes"
  on session_notes for all
  using (auth.uid() = professional_id)
  with check (auth.uid() = professional_id);

-- User can only read notes that the professional explicitly shared with AI
drop policy if exists "Users read AI-shared notes" on session_notes;
create policy "Users read AI-shared notes"
  on session_notes for select
  using (auth.uid() = user_id and is_shared_with_ai = true);

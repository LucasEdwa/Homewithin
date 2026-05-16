-- HomeWithin — Sprint 5: Support Circles (Beta)

-- ─── Circles ─────────────────────────────────────────────────────────────────

create table if not exists circles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text not null,
  rules        text not null default '',
  category     text,
  member_cap   int  not null default 8 check (member_cap between 4 and 8),
  created_at   timestamptz default now()
);

alter table circles enable row level security;

-- Circles are publicly readable (so users can browse and join).
create policy "Circles readable to all"
  on circles for select
  using (true);

-- ─── Circle Members ──────────────────────────────────────────────────────────

create table if not exists circle_members (
  circle_id   uuid references circles(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  intro_seen  boolean default false,
  joined_at   timestamptz default now(),
  primary key (circle_id, user_id)
);

alter table circle_members enable row level security;

-- Members of a circle can see who else is in it.
create policy "Members see circle membership"
  on circle_members for select
  using (
    exists (
      select 1 from circle_members m
      where m.circle_id = circle_members.circle_id
        and m.user_id = auth.uid()
    )
  );

-- Authenticated users can join a circle as themselves.
create policy "Users join circles as themselves"
  on circle_members for insert
  with check (auth.uid() = user_id);

-- Users can update their own membership (intro_seen flag).
create policy "Users update own membership"
  on circle_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can leave a circle (delete their own membership).
create policy "Users leave own circles"
  on circle_members for delete
  using (auth.uid() = user_id);

-- Enforce member cap at the database layer.
create or replace function enforce_circle_cap()
returns trigger
language plpgsql
as $$
declare
  current_count int;
  cap int;
begin
  select member_cap into cap from circles where id = new.circle_id;
  select count(*) into current_count from circle_members where circle_id = new.circle_id;
  if current_count >= cap then
    raise exception 'Circle is full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists circle_cap_check on circle_members;
create trigger circle_cap_check
  before insert on circle_members
  for each row execute function enforce_circle_cap();

-- ─── Circle Messages ─────────────────────────────────────────────────────────

create table if not exists circle_messages (
  id         uuid primary key default gen_random_uuid(),
  circle_id  uuid references circles(id) on delete cascade not null,
  sender_id  uuid references auth.users(id) on delete cascade not null,
  body       text not null,
  created_at timestamptz default now()
);

alter table circle_messages enable row level security;

-- Only members can read circle messages.
create policy "Members read circle messages"
  on circle_messages for select
  using (
    exists (
      select 1 from circle_members
      where circle_members.circle_id = circle_messages.circle_id
        and circle_members.user_id = auth.uid()
    )
  );

-- Only members can send messages as themselves.
create policy "Members send circle messages"
  on circle_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from circle_members
      where circle_members.circle_id = circle_id
        and circle_members.user_id = auth.uid()
    )
  );

-- ─── Circle Reports ──────────────────────────────────────────────────────────

create table if not exists circle_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade not null,
  circle_id   uuid references circles(id) on delete cascade not null,
  message_id  uuid references circle_messages(id) on delete set null,
  reported_id uuid references auth.users(id),
  reason      text not null,
  created_at  timestamptz default now()
);

alter table circle_reports enable row level security;

create policy "Users create circle reports"
  on circle_reports for insert
  with check (auth.uid() = reporter_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists circle_members_user    on circle_members (user_id);
create index if not exists circle_messages_circle on circle_messages (circle_id, created_at asc);

-- ─── Seed circles ────────────────────────────────────────────────────────────

insert into circles (slug, name, description, rules, category, member_cap) values
  (
    'family-rejection-survivors',
    'Family Rejection Survivors',
    'A small circle for people healing from being rejected by family for who they are.',
    E'1. What is shared here stays here.\n2. No advice unless asked — listen first.\n3. No slurs, no shaming, no minimizing pain.\n4. You can leave anytime.',
    'family_rejection',
    8
  ),
  (
    'newly-out',
    'Newly Out',
    'For folks who recently came out (to themselves or others) and are figuring out what comes next.',
    E'1. Celebrate small wins.\n2. No outing anyone elsewhere.\n3. Questions welcome — no question is dumb.\n4. Be kind. You were new once too.',
    'coming_out_safely',
    8
  ),
  (
    'building-confidence',
    'Building Confidence',
    'A space to rebuild self-worth after years of being told you were less.',
    E'1. Lift each other up.\n2. Share progress, not perfection.\n3. No comparing pain — every story matters.\n4. Boundaries are welcome here.',
    'internalized_shame',
    8
  ),
  (
    'religious-trauma',
    'Religious Trauma',
    'For LGBTQ+ people unpacking harm from religious communities or teachings.',
    E'1. All faiths and ex-faiths welcome.\n2. No proselytizing in either direction.\n3. Your story is yours to share — at your own pace.\n4. Trigger warnings encouraged.',
    'religious_trauma',
    8
  )
on conflict (slug) do nothing;

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Run separately in the Supabase dashboard if needed:
--   alter publication supabase_realtime add table circle_messages;

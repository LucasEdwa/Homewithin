-- Sprint 8: Local Resources & Events
-- Provides CMS tables for admins to manage resources and workshops.
-- The app ships with a static seed dataset; these tables allow future
-- server-side overrides without requiring an app update.

-- ─── local_resources ──────────────────────────────────────────────────────────

create table if not exists local_resources (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null check (type in ('lgbtq_center','shelter','therapist','legal_aid','support_group')),
  description  text not null,
  country      text not null,
  region       text,
  city         text,
  website      text,
  phone        text,
  email        text,
  lat          double precision,
  lng          double precision,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table local_resources enable row level security;

-- Everyone can read active resources; only service role can write.
create policy "local_resources_read" on local_resources
  for select using (is_active = true);

create index if not exists local_resources_country_idx on local_resources (country);
create index if not exists local_resources_type_idx    on local_resources (type);

-- ─── workshops ────────────────────────────────────────────────────────────────

create table if not exists workshops (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  host        text not null,
  format      text not null check (format in ('online','in_person','hybrid')),
  date        timestamptz,
  recurring   text,
  link        text,
  category    text,
  free        boolean not null default true,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table workshops enable row level security;

create policy "workshops_read" on workshops
  for select using (is_active = true);

create index if not exists workshops_category_idx on workshops (category);
create index if not exists workshops_format_idx   on workshops (format);

-- ─── local_meetups ────────────────────────────────────────────────────────────

create table if not exists local_meetups (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  city        text not null,
  country     text not null,
  date        timestamptz,
  link        text,
  lat         double precision,
  lng         double precision,
  recurring   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table local_meetups enable row level security;

create policy "local_meetups_read" on local_meetups
  for select using (is_active = true);

create index if not exists local_meetups_country_idx on local_meetups (country);
create index if not exists local_meetups_city_idx    on local_meetups (city);

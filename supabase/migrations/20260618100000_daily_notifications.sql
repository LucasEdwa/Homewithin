-- Daily notification infrastructure
-- Adds tracking tables for AI sessions and resource reads, then schedules
-- twice-daily push notifications (morning + evening) via pg_cron → edge function.

-- ─── pg_net (HTTP from pg_cron) ───────────────────────────────────────────────
create extension if not exists pg_net with schema extensions;

-- ─── AI session log ───────────────────────────────────────────────────────────
-- One row per AI companion interaction. The client inserts after a successful
-- sendAIMessage() call. Used by daily notifications to detect "no AI talk today".

create table if not exists ai_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table ai_sessions enable row level security;

drop policy if exists "Users log own AI sessions" on ai_sessions;
create policy "Users log own AI sessions"
  on ai_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own AI sessions" on ai_sessions;
create policy "Users read own AI sessions"
  on ai_sessions for select
  using (auth.uid() = user_id);

create index if not exists ai_sessions_user_day
  on ai_sessions (user_id, created_at);

-- ─── Resource reads log ───────────────────────────────────────────────────────
-- One row per article opened. Client upserts on article open (conflict = no-op).
-- Daily notifications check for any read today.

create table if not exists resource_reads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  resource_id text not null references resources(id) on delete cascade,
  created_at  timestamptz default now()
);

alter table resource_reads enable row level security;

drop policy if exists "Users log own resource reads" on resource_reads;
create policy "Users log own resource reads"
  on resource_reads for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own resource reads" on resource_reads;
create policy "Users read own resource reads"
  on resource_reads for select
  using (auth.uid() = user_id);

create index if not exists resource_reads_user_day
  on resource_reads (user_id, created_at);

-- ─── pg_cron: daily notification schedule ────────────────────────────────────
-- Calls the send-daily-notifications edge function at 07:00 and 19:00 UTC
-- (~09:00 and 21:00 Stockholm summer time).
--
-- Pre-requisites — add these two secrets to Supabase VAULT (not edge-function
-- env vars) before running this migration. Use the SQL editor or Dashboard →
-- Database → Vault → New Secret:
--
--   INSERT INTO vault.secrets (name, secret)
--   VALUES ('SUPABASE_URL', 'https://<project-ref>.supabase.co')
--   ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;
--
--   INSERT INTO vault.secrets (name, secret)
--   VALUES ('SUPABASE_SERVICE_ROLE_KEY', '<service-role-key>')
--   ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;
--
-- NOTE: `supabase secrets set` sets EDGE FUNCTION env vars, NOT Vault secrets —
-- do NOT use it here. The cron job reads from vault.decrypted_secrets.
--
-- pg_cron and pg_net must both be enabled on your project. Both are available
-- on all Supabase plans; pg_cron ships pre-enabled on Supabase projects.

select cron.unschedule('daily-notifications-morning') where exists (
  select 1 from cron.job where jobname = 'daily-notifications-morning'
);
select cron.schedule(
  'daily-notifications-morning',
  '0 7 * * *',
  $$
  select extensions.http_post(
    url  := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/send-daily-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{"period":"morning"}'::jsonb
  );
  $$
);

select cron.unschedule('daily-notifications-evening') where exists (
  select 1 from cron.job where jobname = 'daily-notifications-evening'
);
select cron.schedule(
  'daily-notifications-evening',
  '0 19 * * *',
  $$
  select extensions.http_post(
    url  := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/send-daily-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{"period":"evening"}'::jsonb
  );
  $$
);

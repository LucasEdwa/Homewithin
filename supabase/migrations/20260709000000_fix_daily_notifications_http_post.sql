-- Fix daily notification cron jobs.
--
-- The original migration (20260618100000_daily_notifications.sql) scheduled
-- both cron jobs to call extensions.http_post(...), but pg_net ships
-- pre-installed in the `net` schema on this project, not `extensions` — so
-- `create extension if not exists pg_net with schema extensions` was a
-- silent no-op and extensions.http_post never existed. Every run of both
-- jobs since deployment has failed with:
--   ERROR: function extensions.http_post(url => text, headers => jsonb, body => jsonb) does not exist
-- meaning no daily notification has ever actually been sent.
--
-- Reschedule both jobs to call net.http_post instead.

select cron.unschedule('daily-notifications-morning') where exists (
  select 1 from cron.job where jobname = 'daily-notifications-morning'
);
select cron.schedule(
  'daily-notifications-morning',
  '0 7 * * *',
  $$
  select net.http_post(
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
  select net.http_post(
    url  := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/send-daily-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{"period":"evening"}'::jsonb
  );
  $$
);

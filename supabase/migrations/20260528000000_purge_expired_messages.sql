-- Requires pg_cron extension (Supabase Dashboard → Database → Extensions → pg_cron).
-- On Pro plan it can be enabled via SQL; on Free plan enable it from the dashboard first.

create extension if not exists pg_cron;

-- Schedule hourly hard-delete of expired disappearing messages.
-- Rows with expires_at in the past are already invisible to clients (filtered in getMessages),
-- but they accumulate in the table — this keeps the table clean.
select cron.schedule(
  'purge-expired-messages',
  '0 * * * *',
  $$DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < now()$$
);

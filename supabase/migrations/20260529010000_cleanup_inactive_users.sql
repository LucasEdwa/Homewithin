-- Daily cleanup of users who haven't been active for 30+ days.
-- Cascade deletes their profiles, matches, messages, check-ins, etc.
-- pg_cron is already enabled via 20260528000000_purge_expired_messages.sql.

-- Anonymous users: use created_at because they never re-authenticate.
-- Named users: use last_sign_in_at so active sessions are preserved.
select cron.schedule(
  'cleanup-inactive-users',
  '0 4 * * *',  -- daily at 04:00 UTC (off-peak)
  $$
    DELETE FROM auth.users
    WHERE is_anonymous = true
      AND created_at < now() - interval '30 days';

    DELETE FROM auth.users
    WHERE (is_anonymous = false OR is_anonymous IS NULL)
      AND last_sign_in_at < now() - interval '30 days';
  $$
);

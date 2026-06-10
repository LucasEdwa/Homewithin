-- Allow unauthenticated (anon-role) requests to read non-hidden user profiles.
--
-- user_profiles was previously only granted to `authenticated`, which meant
-- that any request made without a valid JWT (e.g. before signInAnonymously()
-- completes, or after a SecureStore keychain failure silently drops the token)
-- would be blocked at the grant level before RLS even ran. The result was that
-- findMatches / matchesWithProfiles returned [] and peer avatars never rendered
-- for anonymous users.
--
-- The existing RLS policy "Public profiles are readable" already restricts rows
-- to hide_from_search = false, so granting SELECT to anon exposes only the same
-- data that authenticated users can already see.

grant select on table public.user_profiles to anon;

-- Migration: Explicit API grants for PostgREST / supabase-js
--
-- From 30 May 2026, Supabase no longer auto-exposes public schema tables to the
-- Data API. New tables require an explicit GRANT before they can be queried via
-- PostgREST, GraphQL, or supabase-js. Existing tables on existing projects are
-- unaffected until 30 October 2026, but this migration future-proofs the schema
-- now so any new table added after 30 May continues to work.
--
-- RLS is already enabled on every table in this project, so granting broad
-- permissions here is safe — RLS enforces the actual per-row access rules.

-- Schema usage
grant usage on schema public to anon, authenticated;

-- ─── User-owned tables (authenticated only) ───────────────────────────────────
grant select, insert, update, delete on table public.check_ins         to authenticated;
grant select, insert, update, delete on table public.journal_entries   to authenticated;
grant select, insert, update, delete on table public.user_profiles     to authenticated;
grant select, insert, update, delete on table public.user_progress     to authenticated;
grant select, insert, update, delete on table public.matches           to authenticated;
grant select, insert, update, delete on table public.messages          to authenticated;
grant select, insert, update, delete on table public.blocks            to authenticated;
grant select, insert, update, delete on table public.reports           to authenticated;
grant select, insert, update, delete on table public.circles           to authenticated;
grant select, insert, update, delete on table public.circle_members    to authenticated;
grant select, insert, update, delete on table public.circle_messages   to authenticated;
grant select, insert, update, delete on table public.circle_reports    to authenticated;

-- ─── Publicly readable tables (anon + authenticated) ─────────────────────────
grant select on table public.resources       to anon, authenticated;
grant select on table public.programs        to anon, authenticated;
grant select on table public.lessons         to anon, authenticated;
grant select on table public.local_resources to anon, authenticated;
grant select on table public.local_meetups   to anon, authenticated;
grant select on table public.workshops       to anon, authenticated;

-- ─── Sequences (needed for any serial / identity columns) ─────────────────────
grant usage, select on all sequences in schema public to anon, authenticated;

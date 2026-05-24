-- HomeWithin — Fix circles RLS infinite-recursion bug
-- Simplifies circle_members SELECT policy that was self-referencing and causing stack overflows.
-- Also adds a denormalized member_count column to circles to avoid expensive subqueries.
--
-- Problem 1: "Members see circle membership" SELECT policy queried circle_members
--   from within itself → infinite recursion on every SELECT.
-- Problem 2: enforce_circle_cap trigger ran as the invoking user, so its
--   SELECT against circle_members also hit the recursive policy.
-- Fix: simplify the SELECT policy to auth.uid() = user_id (each user sees only
--   their own rows), add a denormalized member_count column on circles maintained
--   by a SECURITY DEFINER trigger, and rewrite enforce_circle_cap to read
--   member_count from circles (no RLS-gated table scan needed).

-- ─── 1. Fix SELECT policy ────────────────────────────────────────────────────

drop policy if exists "Members see circle membership" on circle_members;

create policy "Members see own membership"
  on circle_members for select
  using (auth.uid() = user_id);

-- ─── 2. Denormalized member_count on circles ─────────────────────────────────

alter table circles
  add column if not exists member_count int not null default 0;

-- Back-fill from existing rows (safe even on an empty table).
update circles c
set member_count = (
  select count(*) from circle_members m where m.circle_id = c.id
);

-- Trigger to keep member_count current on join / leave.
create or replace function update_circle_member_count()
returns trigger
language plpgsql
security definer          -- bypasses RLS so it can always read/write circles
as $$
begin
  if tg_op = 'INSERT' then
    update circles set member_count = member_count + 1 where id = new.circle_id;
  elsif tg_op = 'DELETE' then
    update circles set member_count = greatest(member_count - 1, 0) where id = old.circle_id;
  end if;
  return null;
end;
$$;

drop trigger if exists circle_member_count_update on circle_members;
create trigger circle_member_count_update
  after insert or delete on circle_members
  for each row execute function update_circle_member_count();

-- ─── 3. Fix enforce_circle_cap (use member_count, SECURITY DEFINER) ──────────

create or replace function enforce_circle_cap()
returns trigger
language plpgsql
security definer          -- bypasses RLS; reads circles.member_count directly
as $$
declare
  v_cap   int;
  v_count int;
begin
  select member_cap, member_count
    into v_cap, v_count
    from circles
   where id = new.circle_id;

  if v_count >= v_cap then
    raise exception 'Circle is full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Trigger already exists from sprint5 migration; recreating it is a no-op
-- if the function signature is the same, but drop+create to be safe.
drop trigger if exists circle_cap_check on circle_members;
create trigger circle_cap_check
  before insert on circle_members
  for each row execute function enforce_circle_cap();

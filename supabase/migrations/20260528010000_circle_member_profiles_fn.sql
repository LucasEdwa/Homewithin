-- HomeWithin — SECURITY DEFINER function to fetch all member profiles for a circle
--
-- Why this is needed:
--   circle_members SELECT RLS is `auth.uid() = user_id` to prevent infinite
--   recursion (the original policy queried circle_members from within itself).
--   As a result, querying circle_members from the client only returns the
--   current user's own row, making it impossible to resolve other members'
--   nicknames/avatars for the chat UI.
--
-- Fix: a SECURITY DEFINER function runs as the function owner (bypasses RLS)
--   but still enforces that the caller must themselves be a member of the circle.

create or replace function public.get_circle_member_profiles(p_circle_id uuid)
returns table (
  user_id   uuid,
  nickname  text,
  avatar_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    up.user_id,
    up.nickname,
    up.avatar_url
  from circle_members cm
  join user_profiles   up on up.user_id = cm.user_id
  where cm.circle_id = p_circle_id
    -- Caller must be a member of this circle (security guard)
    and exists (
      select 1
      from circle_members cm2
      where cm2.circle_id = p_circle_id
        and cm2.user_id   = auth.uid()
    );
$$;

grant execute on function public.get_circle_member_profiles(uuid) to authenticated;

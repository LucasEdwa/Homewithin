-- Circle member moderation support.
-- Adds member roles, makes the first member of each circle a moderator,
-- extends the member profile RPC to return roles, and adds a SECURITY DEFINER
-- helper so moderators can remove members from their circle.

alter table circle_members
  add column if not exists role text not null default 'member' check (role in ('member', 'moderator'));

with ranked_members as (
  select
    circle_id,
    user_id,
    row_number() over (
      partition by circle_id
      order by joined_at asc, user_id asc
    ) as rn
  from circle_members
)
update circle_members cm
set role = case when ranked_members.rn = 1 then 'moderator' else 'member' end
from ranked_members
where cm.circle_id = ranked_members.circle_id
  and cm.user_id = ranked_members.user_id;

create or replace function public.assign_circle_member_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_count int;
begin
  select count(*) into member_count
  from circle_members
  where circle_id = new.circle_id;

  if member_count = 0 then
    new.role := 'moderator';
  elsif new.role is null then
    new.role := 'member';
  end if;

  return new;
end;
$$;

drop trigger if exists circle_member_role_assignment on circle_members;
create trigger circle_member_role_assignment
  before insert on circle_members
  for each row execute function assign_circle_member_role();

create or replace function public.get_circle_member_profiles(p_circle_id uuid)
returns table (
  user_id uuid,
  nickname text,
  avatar_url text,
  role text
)
language sql
security definer
stable
set search_path = public
as $$
  select up.user_id, up.nickname, up.avatar_url, cm.role
  from circle_members cm
  join user_profiles up on up.user_id = cm.user_id
  where cm.circle_id = p_circle_id
    and exists (
      select 1
      from circle_members cm2
      where cm2.circle_id = p_circle_id
        and cm2.user_id = auth.uid()
    );
$$;

grant execute on function public.get_circle_member_profiles(uuid) to authenticated;

create or replace function public.kick_circle_member(
  p_circle_id uuid,
  p_target_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  is_moderator boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  if p_target_user_id = auth.uid() then
    return false;
  end if;

  select exists(
    select 1
    from circle_members
    where circle_id = p_circle_id
      and user_id = auth.uid()
      and role = 'moderator'
  ) into is_moderator;

  if not is_moderator then
    return false;
  end if;

  delete from circle_members
  where circle_id = p_circle_id
    and user_id = p_target_user_id;

  return found;
end;
$$;

grant execute on function public.kick_circle_member(uuid, uuid) to authenticated;
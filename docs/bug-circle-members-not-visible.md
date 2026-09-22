# Bug: Circle Chat Shows "Someone" With No Avatar for Other Members

## Symptom

- Opening a support circle chat showed only the current user in the members panel.
- Messages sent by other users appeared as **"Someone"** with no avatar, even when another user was logged in and in the same circle.

## Root Cause

The `circle_members` table has a SELECT RLS policy locked to:

```sql
auth.uid() = user_id
```

This policy was introduced in `20260516050000_sprint5_rls_fix.sql` to fix an **infinite recursion** bug — the original policy queried `circle_members` from within itself, causing a stack overflow on every SELECT.

The side effect: any client-side query to `circle_members` (even with a `circle_id` filter) only ever returns the **current user's own row**. So `fetchMemberMap` could only resolve the current user's profile, and every other sender got `senderNickname: undefined` → displayed as "Someone" with no avatar.

## Fix

### 1. New migration — `20260528010000_circle_member_profiles_fn.sql`

Added a `SECURITY DEFINER` Postgres function:

```sql
create or replace function public.get_circle_member_profiles(p_circle_id uuid)
returns table (user_id uuid, nickname text, avatar_url text)
language sql security definer stable
set search_path = public
as $$
  select up.user_id, up.nickname, up.avatar_url
  from circle_members cm
  join user_profiles up on up.user_id = cm.user_id
  where cm.circle_id = p_circle_id
    and exists (
      select 1 from circle_members cm2
      where cm2.circle_id = p_circle_id
        and cm2.user_id = auth.uid()
    );
$$;

grant execute on function public.get_circle_member_profiles(uuid) to authenticated;
```

`SECURITY DEFINER` runs as the function owner, bypassing RLS on `circle_members`. The `exists` guard ensures only actual circle members can call it — non-members get an empty result set.

### 2. `services/social/circles.ts` — `fetchMemberMap`

Replaced the two-step query (`circle_members` → `user_profiles`) with a single RPC call:

```ts
// Before (broken — RLS filters to current user only)
const { data: members } = await supabase
  .from("circle_members")
  .select("user_id")
  .eq("circle_id", circleId);
// ...then query user_profiles with the ids

// After (correct)
const { data: profiles } = await supabase.rpc(
  "get_circle_member_profiles",
  { p_circle_id: circleId },
);
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260528010000_circle_member_profiles_fn.sql` | New — adds `get_circle_member_profiles` SECURITY DEFINER function |
| `services/social/circles.ts` | `fetchMemberMap` now calls the RPC instead of querying `circle_members` directly |

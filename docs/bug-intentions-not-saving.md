# Bug: Matching Intentions Not Saving to Database

**Date:** 2026-05-19
**Severity:** High — user data silently not persisted
**Files affected:**
- `services/matching.ts`
- `app/intentions.tsx`

---

## Problem

Users could select their matching intentions (e.g. "Looking for community", "Offering support") and tap **Save**, see the "Saved" confirmation, and yet the data was never written to the Supabase `user_profiles` table.

### Root Cause 1 — Silent error in `syncProfile`

`services/matching.ts` → `syncProfile()` was catching Supabase errors but not surfacing them:

```ts
// BEFORE — error is swallowed
if (error) console.error("Profile sync failed:", error.message);
```

The function returned normally even when the DB write failed, so the caller had no way to know anything went wrong.

### Root Cause 2 — Missing `onConflict` in upsert

The Supabase `upsert` call did not specify which column to use as the conflict key:

```ts
// BEFORE — conflict column not specified
await supabase.from("user_profiles").upsert({ user_id: uid, ... });
```

Without `onConflict: 'user_id'`, Supabase may fall back to an insert attempt instead of updating the existing row, which fails silently if a row for that user already exists.

### Root Cause 3 — No error handling in `handleSave`

`app/intentions.tsx` → `handleSave()` had no `try/catch`, so:

- The "Saved" alert always fired regardless of whether the DB write succeeded.
- If an error was thrown, `setSaving(false)` was never reached, leaving the button permanently stuck on "Saving…".

```ts
// BEFORE — no try/catch, setSaving never resets on failure
await setProfile(updated);
await syncProfile(updated);
setSaving(false);          // never runs if syncProfile throws
Alert.alert('Saved', ...); // always fires
```

---

## Solution

### 1. `services/matching.ts` — throw on error + explicit `onConflict`

```ts
// AFTER
const { error } = await supabase.from("user_profiles").upsert(
  {
    user_id: uid,
    // ...fields
    intentions: profile.intentions ?? [],
    updated_at: new Date().toISOString(),
  },
  { onConflict: "user_id" }   // ← explicit conflict column
);
if (error) throw new Error(error.message); // ← throw so callers know it failed
```

### 2. `app/intentions.tsx` — wrap `handleSave` in try/catch/finally

```ts
// AFTER
async function handleSave() {
  if (!profile) return;
  setSaving(true);
  try {
    const intentions = Array.from(selected);
    const updated = { ...profile, intentions };
    await setProfile(updated);
    await syncProfile(updated);
    Alert.alert('Saved', 'Your matching preferences are updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  } catch (e: any) {
    Alert.alert('Could not save', e?.message ?? 'Please check your connection and try again.');
  } finally {
    setSaving(false); // ← always resets, even on failure
  }
}
```

---

## Additional Check — Supabase RLS Policy

If the error persists after this fix, verify the Row Level Security policy on `user_profiles` allows authenticated users to update their own row:

```sql
-- Required RLS policy for updates
create policy "Users can update own profile"
on user_profiles
for update
using (auth.uid() = user_id);
```

Without this policy, the upsert will fail with a permissions error that is now correctly surfaced to the user as an alert.

# Bug: Authenticated User Still Sees Anonymous Profile (Cold Start)

**Date:** 2026-05-19
**Severity:** Critical — signed-in users cannot access their own data
**Files affected:**
- `context/SessionContext.tsx`

---

## Symptoms

```
WARN  Profile hydrate: no authenticated Supabase user
WARN  [syncProfile] No authenticated user — profile not synced to DB
ERROR You must be signed in to save preferences to the server.
```

User signs in with email/password, but the profile screen shows an anonymous profile. Saving intentions fails with "not signed in" errors.

---

## Root Causes

### 1. Cold start skipped Supabase auth when a local profile existed

The init function only fetched from Supabase if there was **no** local profile in SecureStore:

```ts
// BEFORE — Supabase never checked if anonymous profile already in storage
let profile = session as UserProfile | null;
if (!profile && supabase) {
  // fetch from DB...
}
```

**Sequence that broke it:**
1. User opens app as guest → anonymous profile saved to SecureStore
2. User signs in → navigates away, Supabase session stored
3. App cold-starts → finds anonymous profile in SecureStore → `!profile` is `false` → Supabase never queried
4. Anonymous profile wins, real account data never loaded

### 2. `onAuthStateChange` race condition

A previous fix added a listener for `SIGNED_IN` events to re-hydrate the profile after login. However, when there is already a **persisted Supabase session** (from a previous sign-in), the SDK fires `SIGNED_IN` during its own initialization — before the React `useEffect` has had a chance to register the listener. That event is missed entirely.

---

## Solution

### `context/SessionContext.tsx` — always check Supabase auth on startup

Changed the condition from `if (!profile && supabase)` to `if (supabase)`. The DB is now always queried on cold start when Supabase is configured. An authenticated session overrides whatever is in local storage.

```ts
// AFTER — Supabase always checked; authenticated profile wins over anonymous local
let profile = session as UserProfile | null;
if (supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // fetch real profile from user_profiles and override local
  } else {
    // no session — keep local anonymous profile as-is
  }
}
```

Also corrected `isAnonymous: true` → `isAnonymous: false` on the hydrated profile, since an authenticated user is not anonymous.

### Why the `onAuthStateChange` listener is still kept

The listener handles the **runtime sign-in** case (user taps Sign In while the app is already open). The cold-start fix handles the **persisted session** case. Both are needed.

---

## Behavior After Fix

| Scenario | Before | After |
|---|---|---|
| Cold start, signed in | Shows anonymous profile | Shows real account profile |
| Cold start, guest | Shows anonymous profile | Shows anonymous profile (correct) |
| Sign in while app open | Shows anonymous profile | Shows real account profile |
| Sign out, cold start | — | Shows anonymous / welcome screen |

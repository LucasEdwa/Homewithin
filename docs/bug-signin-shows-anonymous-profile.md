# Bug: Signed-In User Sees Anonymous Profile

**Date:** 2026-05-19
**Severity:** High — user identity shown incorrectly after authentication
**Files affected:**
- `context/SessionContext.tsx`

---

## Problem

After signing in with email and password, the profile screen continued to display the anonymous profile (nickname, no data) instead of the user's real account data from Supabase.

### Root Cause — Profile hydrated once at startup, never refreshed on sign-in

`SessionContext` loads the profile **once on mount** from SecureStore (local storage). The hydration logic only fetches from Supabase if there is **no local profile**:

```ts
// BEFORE — only hydrates from Supabase if local profile is missing
let profile = session as UserProfile | null;
if (!profile && supabase) {
  // fetch from DB...
}
```

**The sequence that breaks it:**

1. User opens app as guest → anonymous profile saved to SecureStore
2. User taps **Sign in** → `supabase.auth.signInWithPassword()` succeeds
3. App navigates to `/(tabs)` — but `SessionContext` is still alive with the old anonymous state
4. `init()` already ran on mount and will not run again
5. Profile screen shows the anonymous local profile — the real Supabase profile is never fetched

There was no listener watching for authentication changes, so the context had no way to react when the user signed in.

---

## Solution — Listen to `onAuthStateChange` and re-hydrate on `SIGNED_IN`

Added a second `useEffect` in `SessionContext` that subscribes to Supabase's auth state change event. When a `SIGNED_IN` event fires (including after `signInWithPassword`), it fetches the real profile from `user_profiles` and replaces the local anonymous one:

```ts
// AFTER
useEffect(() => {
  const client = supabase;
  if (!client) return;

  const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const uid = session.user.id;
      const { data: row } = await client
        .from('user_profiles')
        .select('nickname, age_range, language, country, hide_from_search, needs, intentions')
        .eq('user_id', uid)
        .maybeSingle();

      if (row) {
        const hydrated: UserProfile = {
          nickname: row.nickname ?? '',
          pronouns: '',
          ageRange: row.age_range ?? '',
          language: row.language ?? '',
          country: row.country ?? '',
          hideFromSearch: !!row.hide_from_search,
          needs: row.needs ?? [],
          intentions: row.intentions ?? [],
          isAnonymous: false,
        };
        setState(s => ({ ...s, profile: hydrated, onboardingComplete: true }));
        await saveSession(hydrated).catch(() => {});
      }
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

**Why `const client = supabase`:** TypeScript cannot narrow a module-level nullable value inside an async callback. Capturing it in a `const` before the callback ensures the type is `SupabaseClient` (not `SupabaseClient | null`) throughout.

---

## Result

- Sign in → profile screen immediately shows the real nickname, country, intentions, etc.
- Local SecureStore is also updated so the next cold start loads the correct profile without a network round-trip.
- Anonymous users (no Supabase session) are unaffected — the listener fires no events for them.

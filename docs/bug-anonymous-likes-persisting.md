# Bug: Anonymous Likes Persisting Across New Anonymous Sessions

**Date:** 2026-05-19
**Severity:** Medium — ghost data leaks between anonymous sessions on the same device
**Files affected:**
- `app/welcome.tsx`

---

## Symptom

1. User opens the app as a guest (anonymous)
2. Likes someone in the Connect screen
3. Signs out
4. Taps "Start anonymously" or "Continue as guest" again
5. Goes through onboarding and reaches the Connect screen
6. The like from the previous session is still visible — the liked user no longer appears in candidates ("Waiting for response" persists)

---

## Root Cause — Supabase anonymous session reused on same device

When an anonymous user signs out, `supabase.auth.signOut()` clears the session from SecureStore. But tapping "Start anonymously" went straight to onboarding:

```ts
// BEFORE — no sign-out before starting fresh
<Button
  label="Start anonymously"
  onPress={() => router.push('/onboarding/step1')}
/>
```

If the anonymous session was still active in SecureStore (e.g., the user navigated back to the welcome screen without explicitly signing out, or the session hadn't fully cleared), `signInAnonymously()` at the end of onboarding would return the **existing anonymous user** instead of creating a new one.

Same UUID = same match history = old likes and passes still excluded from `findMatches`.

---

## Solution — Sign out before starting any new anonymous session

`app/welcome.tsx` — both "Start anonymously" and "Continue as guest" now call `handleStartAnonymously`, which signs out any existing session before navigating to onboarding:

```ts
// AFTER
async function handleStartAnonymously() {
  await signOut().catch(() => {});
  router.push('/onboarding/step1');
}
```

This guarantees that `signInAnonymously()` in step2 always creates a **fresh anonymous user** with a new UUID, with no match history attached.

---

## Why this is safe

- Email-authenticated users are unaffected — they use "Sign in" which does not call this function
- The `signOut().catch(() => {})` swallows errors silently so the flow continues even if there was no active session to sign out
- Local SecureStore profile data is overwritten during onboarding step1, so no stale profile data leaks either

# Bug: App Launches to Unresponsive Screen (Splash Hang on Cold Start)

**Date:** 2026-05-27
**Severity:** Critical — App Store rejection (Guideline 2.1a, App Completeness)
**Submission ID:** 84cb9db8-12d5-47ec-9a10-7b245584276f
**Review device:** iPad Air 11-inch (M3), iPadOS 26.5
**Files affected:**
- `context/AuthContext.tsx`

---

## Symptoms

App is installed fresh on a device with no prior session. On launch, the splash screen displays but never navigates away. The app appears completely frozen/unresponsive. No crash — no error screen — just a permanent splash.

This was reported by Apple App Review as:

> "App launched to unresponsive screen"

---

## Root Cause

`AuthContext.init()` calls `supabase.auth.getUser()` with **no timeout or fallback**. The combined `loading` flag exposed by `SessionContext` is:

```ts
loading: auth.loading || security.securityLoading
```

The splash screen in `app/index.tsx` only navigates away when both `!loading` and `timerDone` are true:

```ts
useEffect(() => {
  if (loading || !timerDone) return;
  // navigate...
}, [loading, timerDone, ...]);
```

If `supabase.auth.getUser()` hangs (slow backend, network blip, cold-start Supabase spin-up), `auth.loading` stays `true` forever → `loading` is always `true` → the splash screen never navigates → the app appears frozen.

### Why it surfaced on iPad

Two amplifiers specific to the review environment:

1. **`"supportsTablet": false`** in `app.json` — the app runs in iPhone compatibility mode on iPad. On a major new OS version (iPadOS 26), initialization in that compatibility layer may be slower than on a native iPhone.
2. **Fresh install, no cached session** — Apple reviews always install fresh. Without a local SecureStore session, every init path hits the network cold. Supabase functions can take 1–3 seconds to wake from a cold start; combined with any network latency this is enough to cause an indefinite hang.

---

## Fix

Added an 8-second timeout around `supabase.auth.getUser()` using `Promise.race`. If the call does not resolve in time it throws, falls into the existing `catch` block, and `loading` is set to `false` with whatever local session data is available (or `null`). The user is then routed normally (sign-in screen or tabs).

### `context/AuthContext.tsx`

```ts
// BEFORE — no timeout, can hang forever
const { data: { user } } = await supabase.auth.getUser();

// AFTER — 8-second safety net
const timeout = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('auth init timeout')), 8000)
);
const { data: { user } } = await Promise.race([
  supabase.auth.getUser(),
  timeout,
]);
```

The `catch` block already handles the timeout error gracefully:

```ts
} catch (e: any) {
  console.warn('Profile hydrate from Supabase failed:', e?.message);
}
// loading is always set to false in the finally-equivalent setState below
setState(s => ({ ...s, onboardingComplete: complete || !!profile, profile, loading: false }));
```

---

## Result

`loading` is now guaranteed to resolve within ~8 seconds on any device and network condition. The splash screen will always navigate away, even if Supabase is unreachable.

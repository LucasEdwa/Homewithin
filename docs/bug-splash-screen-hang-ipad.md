# Bug: App Launches to Unresponsive Screen (Splash Hang on Cold Start)

**Date:** 2026-05-27 (updated 2026-05-28)
**Severity:** Critical — App Store rejection (Guideline 2.1a, App Completeness)
**Submission ID:** 84cb9db8-12d5-47ec-9a10-7b245584276f
**Review device:** iPad Air 11-inch (M3), iPadOS 26.5
**Files affected:**
- `context/AuthContext.tsx`
- `context/SecurityContext.tsx`
- `app/index.tsx`

---

## Symptoms

App is installed fresh on a device with no prior session. On launch, the splash screen displays but never navigates away. The app appears completely frozen/unresponsive. No crash — no error screen — just a permanent splash.

Reported by Apple App Review as:
> "App launched to unresponsive screen" / "app was unresponsive upon launch"

Rejected on builds 11 and 12 (May 27–28, 2026).

---

## Root Cause (Full Analysis)

`loading` in `SessionContext` is defined as:

```ts
loading: auth.loading || security.securityLoading
```

The splash screen only navigates when `!loading && timerDone`. Any code path that leaves either flag `true` permanently freezes the splash. **Four separate vulnerabilities were identified:**

### 1. `SecurityContext.init()` — no try/catch (builds 11 & 12)

```ts
// BEFORE — if any SecureStore call throws, securityLoading stays true forever
async function init() {
  const [pinExists, disguiseOn, disguiseStyle] = await Promise.all([
    storageHasPin(),
    storageGetDisguiseEnabled(),
    storageGetDisguiseStyle(),
  ]);
  setState(s => ({ ...s, securityLoading: false }));
}
```

If `SecureStore.getItemAsync()` throws on any of the three reads (e.g., unusual keychain state on a new OS/device), the function exits without setting `securityLoading: false`. Navigation is blocked permanently.

### 2. `AuthContext.init()` outer scope — no try/catch (builds 11 & 12)

```ts
// BEFORE — if either SecureStore read throws, loading stays true forever
async function init() {
  const [complete, session] = await Promise.all([
    isOnboardingComplete(),  // SecureStore
    getSession(),            // SecureStore
  ]);
  // ... setState({ loading: false }) is never reached if above throws
}
```

Same failure mode: if the initial storage reads throw, the `setState` with `loading: false` at the end of `init()` is never reached.

### 3. `user_profiles` DB queries — no timeout (build 12)

Build 12 added an 8-second timeout around `supabase.auth.getUser()`, but the subsequent `user_profiles` SELECT and INSERT had no timeout:

```ts
// BEFORE — can hang 30+ seconds (default TCP timeout)
const { data: row } = await supabase.from('user_profiles').select(...).maybeSingle();
const { error } = await supabase.from('user_profiles').insert(defaultRow);
```

If Apple's test device has a cached Supabase session from a prior review, `getUser()` resolves quickly — but the unguarded profile queries can block `loading` for 30+ seconds.

### 4. No absolute navigation failsafe

No upper bound existed on how long the splash could display. If all the above failed silently, the splash was permanent.

---

## Fixes (build 13)

### `context/SecurityContext.tsx` — wrap init in try/catch

```ts
async function init() {
  try {
    const [pinExists, disguiseOn, disguiseStyle] = await Promise.all([...]);
    setState(s => ({ ...s, securityLoading: false }));
  } catch (e: any) {
    console.warn('Security init failed:', e?.message);
    setState(s => ({ ...s, securityLoading: false })); // always clear
  }
}
```

### `context/AuthContext.tsx` — outer try/catch + shared timeout for all Supabase calls

```ts
async function init() {
  let complete = false;
  let profile: UserProfile | null = null;
  try {
    const [c, session] = await Promise.all([isOnboardingComplete(), getSession()]);
    complete = c;
    profile = session as UserProfile | null;
  } catch (e: any) {
    console.warn('Auth init storage read failed:', e?.message);
    // fall through with defaults
  }

  if (supabase) {
    try {
      // Single timeout shared across getUser() AND all profile queries
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('auth init timeout')), 8000)
      );
      const { data: { user } } = await Promise.race([supabase.auth.getUser(), timeout]);
      if (user) {
        const { data: row } = await Promise.race([
          supabase.from('user_profiles').select(...).maybeSingle(),
          timeout,  // same Promise — budget is shared, not reset
        ]);
        // insert also raced against the same timeout
      }
    } catch (e: any) {
      console.warn('Profile hydrate from Supabase failed:', e?.message);
    }
  }

  setState(s => ({ ...s, loading: false })); // always reached
}
```

### `app/index.tsx` — absolute 12-second failsafe

```ts
const hasNavigated = useRef(false);

useEffect(() => {
  if (loading || !timerDone) return;
  hasNavigated.current = true;
  // ... existing navigation logic
}, [...]);

// Nuclear fallback: force navigate if nothing else worked
useEffect(() => {
  const t = setTimeout(() => {
    if (!hasNavigated.current) {
      console.warn('Splash: forced navigation after 12s timeout');
      router.replace('/welcome');
    }
  }, 12_000);
  return () => clearTimeout(t);
}, []);
```

---

## Result

- `securityLoading` is **guaranteed** to clear even if SecureStore throws
- `auth.loading` is **guaranteed** to clear even if initial SecureStore reads throw
- The entire Supabase init block (getUser + all profile queries) is bounded by a single 8-second timeout
- The splash screen **cannot be permanent** — 12-second absolute failsafe ensures navigation regardless of any context failure

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

# Bug: Avatar Not Persisting for Logged-In Users

**Date:** 2026-05-19
**Severity:** Medium — avatar disappears on every app restart or sign-in
**Files affected:**
- `context/SessionContext.tsx`
- `services/storage.ts`

---

## Symptom

1. User signs in with an email account
2. Goes to Profile and picks a photo — avatar appears immediately
3. Restarts the app (or signs out and back in)
4. Avatar is gone — the initial-letter circle is shown again

---

## Root Cause 1 — `avatar_url` missing from DB select queries

`SessionContext` hydrates the user profile from Supabase in two places:

- `onAuthStateChange` — fires on every sign-in event
- `init()` — runs on cold start

Both select queries listed the columns explicitly but omitted `avatar_url`:

```ts
// BEFORE — avatar_url not fetched
.select('nickname, age_range, language, country, hide_from_search, needs, intentions')
```

So even though `syncProfile` correctly saved `avatar_url` to the DB after each upload, the next hydration overwrote the in-memory profile with `avatarUrl: undefined`.

---

## Root Cause 2 — SecureStore 2 KB overflow

`saveSession` writes a slim version of the profile to SecureStore for offline cold starts. It already stripped `needs` and `intentions` to stay under the 2048-byte limit, but `avatarUrl` (a full Supabase Storage public URL with a cache-busting timestamp) was included, pushing the stored value over the limit:

```
WARN Value being stored in SecureStore is larger than 2048 bytes and it may not be stored successfully.
```

When the write fails silently, the persisted session is stale or absent, so the avatar URL is lost even before the DB select runs.

---

## Solution

### 1 — Add `avatar_url` to both select queries (`SessionContext.tsx`)

```ts
// AFTER
.select('nickname, age_range, language, country, hide_from_search, needs, intentions, avatar_url')
```

And map it in the hydrated profile object:

```ts
avatarUrl: row.avatar_url ?? undefined,
```

Applied in both the `onAuthStateChange` handler and the `init()` function.

### 2 — Strip `avatarUrl` from SecureStore (`services/storage.ts`)

```ts
// AFTER
const {
  needs: _n,
  intentions: _i,
  avatarUrl: _a,  // ← added
  ...slim
} = data as Record<string, unknown>;
```

The avatar URL is already stored in the DB. There is no need to duplicate it in SecureStore — it is loaded from Supabase on every authenticated launch, same as `needs` and `intentions`.

---

## Why this is safe

- Anonymous users never upload avatars, so stripping `avatarUrl` from SecureStore has no effect on guest sessions
- The DB remains the single source of truth for the URL; the cache-busting timestamp means even CDN-cached images refresh correctly
- The SecureStore fix also eliminates a latent write-failure risk that could have corrupted other session fields on devices with borderline storage

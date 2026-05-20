# Architecture Audit — Homewithin

**Date:** 2026-05-20  
**Auditor:** Senior Software Architecture Review  
**Stack:** Expo SDK 54 · React Native 0.81 · Expo Router 6 · Supabase · SecureStore

---

## Overview

Homewithin is a mental-wellness and peer-support app for LGBTQ+ people. Core feature areas: check-ins, journal, AI companion, peer matching / chat, safety tools, programs, and local resources.

The overall architecture is sound — Supabase RLS is correctly enabled, sensitive data lives in SecureStore, crisis detection is in place, and Expo Router provides clean navigation. The issues below are optimizations and correctness fixes, not fundamental redesigns.

---

## Severity Legend

| Level       | Meaning                               |
| ----------- | ------------------------------------- |
| 🔴 Critical | Security risk or data correctness bug |
| 🟠 High     | Performance issue or production bug   |
| 🟡 Medium   | Tech debt with visible UX impact      |
| 🟢 Low      | Code quality / future-proofing        |

---

## Findings

### 🔴 CRITICAL

#### C-1 — PIN hashing has no salt (`services/storage.ts`)

PIN is hashed with raw SHA-256. Identical PINs produce identical hashes, making a brute-force lookup table attack trivial. Should use a slow KDF (PBKDF2 with a per-user salt stored alongside the hash).

```ts
// Current — vulnerable
const hash = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  pin,
);

// Target
// PBKDF2(pin, salt, 200_000 iterations, SHA-256) + store salt:hash
```

#### C-2 — AI rate limiting is client-side only (`services/ai.ts`)

The 20-messages/day cap is enforced entirely in SecureStore. Any user can clear app storage to bypass it. Rate limiting must be enforced server-side (e.g. in the AI edge function or the proxy at `second-horizon.com`).

#### C-3 — `pronouns` never persisted to Supabase (`context/SessionContext.tsx`, `services/matching.ts`)

`UserProfile.pronouns` exists in TypeScript but is never included in any Supabase `select` or `upsert`. Every profile hydration resets it to `''`. Users cannot actually save their pronouns.

---

### 🟠 HIGH

#### H-1 — `findMatches` uses N `.neq()` chains instead of `not('user_id', 'in', ...)` (`services/matching.ts`)

For each excluded user ID, a new `.neq()` is chained onto the Supabase query. With 50+ exclusions the URL grows extremely long and performance degrades. PostgREST supports a proper `not.in` filter:

```ts
// Current — O(N) query params
excludeArr.forEach((id) => {
  query = query.neq("user_id", id);
});

// Target — single filter
query = query.not("user_id", "in", `(${excludeArr.join(",")})`);
```

#### H-2 — `getUnreadCounts` fires N parallel Supabase queries (`services/unread.ts`)

One `SELECT count(*)` query is issued per match ID. With 10 active matches that is 10 round-trips per unread refresh. Replace with a single aggregated query using `GROUP BY match_id`.

#### H-3 — Double profile hydration on startup (`context/SessionContext.tsx`)

`init()` fetches the profile from Supabase AND `onAuthStateChange` fires `SIGNED_IN` on the same startup, triggering a second identical profile fetch. This results in 2 DB reads and 2 `setState` calls on every cold start. The `onAuthStateChange` listener should be skipped for the initial `SIGNED_IN` event (use a `didInit` ref).

#### H-4 — No `useMemo` on context values (SessionContext, UnreadContext)

Both contexts pass a new object reference on every `setState`, causing every consumer component to re-render even when the consumed slice didn't change. Wrap the value in `useMemo`.

#### H-5 — `expo-file-system/legacy` import in `services/avatar.ts`

The legacy `expo-file-system` API is deprecated and will be removed. Should migrate to the new `expo-file-system` module (`FileSystem.uploadAsync` → `FileSystem.createUploadTask`).

#### H-6 — `isAnonymous: true` set on a newly authenticated user (`context/SessionContext.tsx` line ~172)

When auto-creating a profile row for a newly signed-in user with no existing row, `isAnonymous` is incorrectly set to `true`. The user IS authenticated at this point. This can cause the app to show anonymous-mode UI to a signed-in user.

---

### 🟡 MEDIUM

#### M-1 — Debug `console.log` left in production services

`[syncProfile] upserting for uid ...` and `[syncProfile] upsert success for uid ...` are verbose logs in `matching.ts` that will appear in every production build. These should be removed or gated behind a `__DEV__` flag.

#### M-2 — No offline / network error state management

All service errors are swallowed silently (`.catch(() => {})`). When the device is offline, the UI shows no loading or error state — it silently shows stale or empty data. A minimal network error banner and retry pattern is needed.

#### M-3 — No index on `messages.created_at`

`getUnreadCounts` queries `messages` with `.gt('created_at', since)`. Without an index on `created_at`, this is a full table scan. Add `CREATE INDEX messages_created_at ON messages(created_at)` in a migration.

#### M-4 — `appVersionSource` not set in `eas.json`

EAS warns about this on every build. Adding `"cli": { "appVersionSource": "remote" }` (or `"local"`) to `eas.json` eliminates the warning and makes version management explicit.

#### M-5 — No `.env.example` file

New contributors don't know which environment variables are required (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_AI_API_KEY`). An `.env.example` with placeholder values should be committed.

#### M-6 — AI endpoint URL hardcoded in source (`services/ai.ts`)

`AI_ENDPOINT = 'https://app.second-horizon.com/chat'` is a hardcoded production URL. It should be in `EXPO_PUBLIC_AI_ENDPOINT` so it can differ per environment (dev/staging/prod).

---

### 🟢 LOW

#### L-1 — Unused `journal_entries` cloud table in schema

The schema includes a `journal_entries` table with a comment saying it's for "opt-in cloud backup (Sprint 3+)". It is not yet used. Until implemented, this creates misleading schema and potential migration confusion.

#### L-2 — No service-level unit tests

Tests exist for UI components but there are no tests for the critical services (`matching.ts`, `chat.ts`, `unread.ts`, `storage.ts`, `ai.ts`). These carry the most business logic and are the highest-risk for regressions.

#### L-3 — No CI pipeline

There is no GitHub Actions (or equivalent) configuration. Lint and tests must be run manually. A basic CI workflow (lint → test → `expo doctor`) should run on every pull request.

#### L-4 — `react-native-worklets` + New Architecture compatibility unverified

`newArchEnabled: true` is set in `app.json` but `react-native-worklets@0.5.1` may not be fully stable on the New Architecture (Fabric/TurboModules). Should be verified in a staging build before production release.

#### L-5 — EAS `cli.version` constraint is too loose in `eas.json`

`"cli": { "version": ">= 16.0.0" }` allows any EAS CLI version from 16 onward, including major breaking versions. Pin to a minor range (e.g. `"~19.0.0"`) to avoid unexpected breakage.

---

## TODO List (Prioritized)

### Sprint A — Security & Correctness (do before public launch)

- [ ] **C-1** Replace SHA-256 PIN hash with PBKDF2 + salt in `services/storage.ts`
- [ ] **C-2** Move AI rate limiting to server-side (edge function or proxy)
- [ ] **C-3** Add `pronouns` column to `user_profiles` table and include it in all profile select/upsert queries
- [ ] **H-6** Fix `isAnonymous: true` flag incorrectly set on newly-authenticated users in `SessionContext.tsx`
- [ ] **M-5** Create `.env.example` with all required `EXPO_PUBLIC_*` variables documented

### Sprint B — Performance

- [ ] **H-1** Replace N-chained `.neq()` in `findMatches` with PostgREST `.not('user_id', 'in', ...)`
- [ ] **H-2** Replace N parallel queries in `getUnreadCounts` with a single `GROUP BY` aggregation
- [ ] **H-3** Fix double profile hydration on startup — guard `onAuthStateChange` with a `didInit` ref
- [ ] **H-4** Wrap `SessionContext` and `UnreadContext` values in `useMemo`
- [ ] **M-3** Add `CREATE INDEX messages_created_at ON messages(created_at)` migration

### Sprint C — Code Quality & DevEx

- [ ] **H-5** Migrate `services/avatar.ts` from `expo-file-system/legacy` to current API
- [ ] **M-1** Remove or gate `console.log` debug statements behind `__DEV__` in all services
- [ ] **M-2** Add network error handling — surface connectivity errors in the UI instead of silent swallowing
- [ ] **M-4** Set `cli.appVersionSource` in `eas.json` to eliminate EAS build warning
- [ ] **M-6** Move AI endpoint URL to `EXPO_PUBLIC_AI_ENDPOINT` env variable
- [ ] **L-5** Pin EAS CLI version to `~19.0.0` in `eas.json`

### Sprint D — Testing & CI

- [ ] **L-2** Write unit tests for `matching.ts`, `chat.ts`, `unread.ts`, `storage.ts`, `ai.ts`
- [ ] **L-3** Add GitHub Actions CI workflow: `lint → test → expo doctor` on every PR
- [ ] **L-4** Verify `react-native-worklets` compatibility with New Architecture in a staging build

### Backlog

- [ ] **L-1** Implement or remove the `journal_entries` cloud sync table — don't leave it as dead schema
- [ ] Evaluate Sentry (or equivalent) for production error monitoring to replace `console.warn` + silent catches
- [ ] Add pagination to `findMatches` (currently capped at `limit=10` with no cursor)
- [ ] Implement server-side message expiry cleanup for disappearing messages instead of relying on client-side filtering

---

## Architecture Diagram (current)

```
┌─────────────────────────────────────────────┐
│                 Expo Router                  │
│  app/_layout.tsx (ErrorBoundary + LockGate)  │
└───────────┬─────────────────────────────────┘
            │ Context Providers
  ┌─────────▼──────────┐  ┌──────────────────┐
  │  SessionContext     │  │  UnreadContext    │
  │  (profile, auth,   │  │  (unread counts,  │
  │   safety, PIN,     │  │   realtime sub)   │
  │   disguise)        │  └────────┬─────────┘
  └─────────┬──────────┘           │
            │ Services             │
  ┌─────────▼──────────────────────▼─────────┐
  │  matching · chat · notifications · unread │
  │  avatar · storage · ai · progressStats   │
  └──────────────┬────────────────────────────┘
                 │
  ┌──────────────▼────────────────────────────┐
  │              Supabase                      │
  │  Auth · Database (RLS) · Storage          │
  │  Realtime · Edge Functions                 │
  └────────────────────────────────────────────┘
       + SecureStore (PIN, session, journal,
                      AI history, last-read)
```

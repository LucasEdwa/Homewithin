# Chat System — Bug Fixes & Performance Audit

**Date:** 2026-06-14  
**Scope:** Matching, real-time chat, push notifications, avatar display

---

## Bugs Fixed

### 1. App would not open from a notification tap (cold start)

**Symptom:** Tapping a push notification when the app was killed did nothing — the app opened to the home screen instead of the correct chat.

**Root cause:** `addNotificationResponseReceivedListener` only catches taps while the app is already running. When the app is launched from a killed state by a notification tap, the response event fires before any listener is registered and is silently dropped.

**Fix:**
- Added `getInitialNotificationMatchId()` to `services/social/notifications.ts` — calls Expo's `getLastNotificationResponseAsync()` to read the launch-notification matchId.
- Updated `app/_layout.tsx` to check for a cold-start matchId on mount, store it in a ref, and navigate to the correct chat only after the session finishes loading and the PIN lock (if active) is cleared.

**Files changed:**
- `services/social/notifications.ts`
- `app/_layout.tsx`

---

### 2. Chat showed only the current user's messages (intermittent)

**Symptom:** Messages from the other person occasionally stopped appearing. The chat would show only the user's own sent messages until they closed and reopened the app.

**Root cause:** When the Supabase Realtime WebSocket channel encounters a `CHANNEL_ERROR` or `TIMED_OUT` event (network drop, server restart, etc.), it goes silent. No messages from the peer arrive and nothing in the UI signals that the connection is broken. The only recovery was the `AppState` listener, which only fires when the app goes to background and comes back.

**Fix:**
- Added an `onError` callback parameter to `subscribeToMessages` in `services/social/chat.ts`.
- On `CHANNEL_ERROR` or `TIMED_OUT`, the callback immediately calls `loadMessages()` to re-fetch the full message list and catch up on anything missed while the connection was down.

**Files changed:**
- `services/social/chat.ts`
- `hooks/useMessages.ts`

---

### 3. Peer avatar and nickname missing when opening chat from a notification

**Symptom:** When opening a chat by tapping a push notification, the header showed `?` instead of the peer's avatar and name.

**Root cause:** The notification deep link only carries `{ matchId }`. The `ConnectionsSection` passes `nickname` and `avatarUrl` as route params when navigating from inside the app, but the notification handler only passes `matchId`. The chat screen had no fallback to load them from the database.

**Fix:**
- Updated `hooks/useChatScreen.ts` to detect when `nickname` is absent from route params and fetch the peer's `nickname` and `avatar_url` from `user_profiles` using `getMatchPeerId`. The header populates itself a moment after the screen opens.

**Files changed:**
- `hooks/useChatScreen.ts`

---

## Performance Fixes

### P1 — Network call inside every realtime event (UnreadContext)

**Problem:** `currentUserId()` called `supabase.auth.getUser()` — a network round-trip to verify the JWT — on every single incoming message inside the `unread-tracker` realtime callback. Under active chat usage this fires continuously.

**Fix:** Replaced with a `uidRef` populated synchronously via `supabase.auth.onAuthStateChange`. The realtime callback now reads `uidRef.current` with zero async overhead.

**File changed:** `context/UnreadContext.tsx`

---

### P2 — Duplicate expiry purge intervals

**Problem:** `useMessages` ran a 60-second `setInterval` to purge expired messages from state. `useChatScreen` independently ran a 30-second interval doing the same thing. Both called `setMessages`, causing two unnecessary re-renders per minute on every open chat.

**Fix:** Removed the 60-second interval from `useMessages`. The 30-second one in `useChatScreen` is sufficient.

**File changed:** `hooks/useMessages.ts`

---

### P3 — N+1 SQL conditions in `findMatches`

**Problem:** `findMatches` excluded previously-acted-on users by chaining one `.neq("user_id", id)` call per excluded user. With 20 excluded users this generated 20 separate `AND user_id != '...'` conditions in the SQL query.

**Fix:** Replaced with a single `.not("user_id", "in", "(uuid1,uuid2,...)")` clause — one `NOT IN` condition regardless of how many users are excluded.

**File changed:** `services/social/matching.ts`

---

### P4 — No message limit in `getMessages`

**Problem:** `getMessages` fetched every message in a match with no limit. A long-running chat would load thousands of rows on every open and every app foreground.

**Fix:** Added `.limit(100)` fetching the 100 most recent messages (ordered descending, then reversed to chronological order for display). Handles the overwhelming majority of real-world chat lengths without pagination complexity.

**File changed:** `services/social/chat.ts`

---

### P5 — Missing database indexes

**Problem:** Three hot query paths ran without indexes:
- `getMessages` filters by `expires_at` — full table scan on every load.
- RLS policies on `messages` check `sender_id = auth.uid()` on every INSERT/UPDATE.
- The `EXISTS (SELECT 1 FROM matches WHERE ...)` RLS sub-query on messages fired on every SELECT and every realtime event with no composite index on `(requester_id, target_id, status)`.

**Fix:** Migration `20260614000000_chat_performance_indexes.sql` adds:

```sql
-- Speeds up expiry-filtered message fetches and the server-side purge job
create index if not exists messages_expires_at
  on messages (expires_at) where expires_at is not null;

-- Speeds up RLS sender checks and block-user lookups
create index if not exists messages_sender
  on messages (sender_id);

-- Speeds up the RLS EXISTS sub-query joining messages → matches
create index if not exists matches_participants_status
  on matches (requester_id, target_id, status);
```

**Deploy:**
```bash
supabase db push
```

---

## Strong Points (no changes needed)

- **RLS policies are correct.** The `"Match participants can read messages"` SELECT policy allows both participants to read all messages in their shared match. This is not the cause of the "only my messages" bug.
- **`supabase_realtime` publication is set up.** Migration `20260519210000_enable_messages_realtime.sql` correctly adds the messages table to the publication.
- **`AppState` listener in `useMessages` is a good safety net.** It reloads messages whenever the app comes to the foreground, catching anything missed during background time.
- **Message dedup check** (`if (prev.some((m) => m.id === msg.id)) return prev`) correctly prevents optimistic-send messages from being double-rendered when the realtime INSERT event also arrives.
- **`expo-image`** over the legacy React Native `Image` component is the right choice — better caching, transitions, and error handling for avatars.
- **`send-push` edge function** correctly parallelises the sender-nickname and recipient-token fetches with `Promise.all`, keeping notification latency low.

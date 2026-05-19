# Chat & Notifications — Bug Audit, Limitations & Optimizations

**Date:** 2026-05-19
**Scope:** Real-time chat, push notifications, unread tracking, chat header UI

---

## 1. Real-time chat not updating (root bug)

### Symptom
Messages from the other person were only visible after leaving and re-entering the chat screen. The chat felt like polling rather than live.

### Root Cause
The `subscribeToMessages` function in `services/chat.ts` used Supabase's `postgres_changes` realtime API, which is correct — but the `messages` table was never added to Supabase's realtime publication. Without this, the database never emits events, so the subscription callback never fires.

```sql
-- MISSING — this was never run
alter publication supabase_realtime add table messages;
```

### Fix
Created and pushed migration `20260519210000_enable_messages_realtime.sql`:
```sql
alter publication supabase_realtime add table messages;
```

Added a subscription status callback to surface errors instead of failing silently:
```ts
.subscribe((status) => {
  if (status === 'CHANNEL_ERROR') console.warn('[chat] realtime error — check messages table is in supabase_realtime publication');
  if (status === 'TIMED_OUT') console.warn('[chat] realtime subscription timed out');
});
```

Added an `AppState` listener in `app/chat.tsx` as a fallback — when the app returns to the foreground after being backgrounded (WebSocket may have disconnected), `getMessages` re-fetches the full history:
```ts
const appStateSub = AppState.addEventListener('change', (state) => {
  if (state === 'active') loadMessages();
});
```

---

## 2. Peer avatar missing in match list and chat header

### Symptom
Every conversation row in the "Your connections" list showed the initial-letter circle. The chat nav bar also always showed the initial-letter circle, even when the other person had uploaded a profile photo.

### Root Cause — Part A: `matchesWithProfiles` never selected `avatar_url`
`matchesWithProfiles` in `services/matching.ts` is the shared helper used by `getMyMatches`, `getPendingOutgoing`, `getIncomingLikes`, and `acceptIncomingLike`. Its profile select was missing `avatar_url`:

```ts
// BEFORE — avatar_url not fetched
.select("user_id, nickname, age_range, language, country, needs")
```

So `match.peer.avatarUrl` was always `undefined` regardless of what the user had uploaded.

### Root Cause — Part B: `avatarUrl` never forwarded as a route param
Even if Part A had been fixed, the `router.push` calls that open the chat screen only passed `matchId` and `nickname`. `avatarUrl` was never forwarded so the chat header had no URL to display.

### Fix — Part A
Added `avatar_url` to the select in `matchesWithProfiles` and mapped it on the returned peer:

```ts
// AFTER
.select("user_id, nickname, age_range, language, country, needs, avatar_url")

// in the returned peer object:
avatarUrl: p.avatar_url ?? undefined,
```

This fixes avatars in the match list, incoming likes list, and pending outgoing list simultaneously.

### Fix — Part B
Updated all three `router.push` call sites in `app/(tabs)/connect.tsx` to also pass `avatarUrl`:
```ts
router.push({
  pathname: '/chat',
  params: { matchId, nickname, avatarUrl: peer.avatarUrl ?? '' },
});
```

Updated `app/chat.tsx` to read `avatarUrl` from `useLocalSearchParams` and conditionally render the peer's photo using `expo-image`, falling back to the initial circle if no URL is set.

**Files changed:** `services/matching.ts`, `app/(tabs)/connect.tsx`, `app/chat.tsx`

---

## 3. Push notifications — full implementation

### What was built
End-to-end Expo push notification flow so users are notified when a new chat message arrives.

**`services/notifications.ts`**
- Requests notification permission
- Gets the Expo push token via `getExpoPushTokenAsync` using the EAS project ID
- Saves the token to `user_profiles.push_token` in Supabase

**`supabase/migrations/20260519220000_add_push_token.sql`**
```sql
alter table user_profiles add column if not exists push_token text;
```

**`supabase/functions/send-push/index.ts`** (Edge Function)
- Called from the client after every successful `sendMessage`
- Identifies the recipient from the match row
- Fetches sender's nickname and recipient's push token
- POSTs to the Expo Push API at `https://exp.host/--/api/v2/push/send`
- Truncates message previews to 100 chars

**`app/_layout.tsx`**
- Calls `registerForPushNotifications()` once the user has a profile
- Handles notification tap: navigates directly to the correct chat via `matchId` in `notification.data`

**`app.json`**
- Added `expo-notifications` plugin
- Added `UIBackgroundModes: ["remote-notification"]` for iOS
- Added `POST_NOTIFICATIONS`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED` permissions for Android

---

## 4. Push notifications crash in Expo Go (SDK 53 limitation)

### Symptom
```
ERROR  expo-notifications: Android Push notifications (remote notifications) functionality
provided by expo-notifications was removed from Expo Go with the release of SDK 53.
```
The error appeared at module import time, crashing the entire app when run in Expo Go.

### Root Cause
Expo removed remote push notification support from Expo Go in SDK 53. The static `import * as Notifications from 'expo-notifications'` threw at module load time, before any guard code could run.

### Fix
Replaced the static import with a lazy `require()` guarded by an Expo Go detection check:
```ts
const isExpoGo = Constants.executionEnvironment === 'storeClient';

let Notif: NotifModule | null = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notif = require('expo-notifications') as NotifModule;
    Notif.setNotificationHandler({ ... });
  } catch { /* silently disabled */ }
}
```

All exported functions (`registerForPushNotifications`, `addNotificationResponseListener`) are no-ops when `Notif` is `null`.

### Limitation — still pending
**Push notifications do not work in Expo Go.** A development build is required:
```bash
npx expo run:ios
# or
eas build --profile development --platform ios
```
The in-app unread badge and connect-screen indicators work regardless of build type.

---

## 5. Supabase query builder `.catch()` error

### Symptom
```
TypeError: supabase.from('user_profiles').update(...).eq(...).catch is not a function
```

### Root Cause
Supabase v2 query builders are thenables (they implement `.then()`) but not full Promises — they do not expose a `.catch()` method directly on the builder chain.

### Fix
Replaced all `.catch()` chained on Supabase queries with `await` + destructured `{ error }`:
```ts
// BEFORE (broken)
await supabase.from('user_profiles').update(...).eq(...).catch(() => {});

// AFTER
const { error } = await supabase.from('user_profiles').update(...).eq(...);
if (error) console.warn(...);
```

---

## 6. `NotificationBehavior` API change

### Symptom
TypeScript error on `setNotificationHandler`:
```
Type 'Promise<{ shouldShowAlert: true; ... }>' is not assignable to type 'Promise<NotificationBehavior>'
```

### Root Cause
`expo-notifications` SDK 53 renamed the behavior fields. `shouldShowAlert` was split into `shouldShowBanner` (notification banner when app is foregrounded) and `shouldShowList` (whether it appears in the notification center).

### Fix
```ts
// BEFORE
{ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }

// AFTER
{ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }
```

---

## 7. Unread badge only updating on tab tap

### Symptom
The unread count badge on the Connect tab and the per-conversation unread indicators only refreshed when the user manually tapped the Connect tab. New messages arriving while on another tab did not trigger an update.

### Root Cause
The unread refresh logic (`getUnreadCounts`) was called inside a `useFocusEffect` in `connect.tsx`. That hook only fires when the screen gains focus — there was no real-time update path.

### Fix
Moved the realtime subscription into `UnreadContext` itself. A single persistent Supabase channel (`unread-tracker`) subscribes to all `INSERT` events on `messages` at provider mount:

```ts
supabase
  .channel('unread-tracker')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
    const uid = await currentUserId();
    if (row.sender_id === uid) return;           // my own message
    if (!matchIdsRef.current.has(row.match_id)) return;  // not my match
    if (activeMatchRef.current === row.match_id) return;  // chat is open

    setUnreadByMatch(prev => ({ ...prev, [row.match_id]: (prev[row.match_id] ?? 0) + 1 }));
  })
  .subscribe();
```

Added `setActiveMatch(matchId | null)` so the chat screen tells the context which match is currently open, preventing double-counting messages already visible on screen.

---

## 8. Architecture overview — what was built

| File | Role |
|---|---|
| `services/unread.ts` | SecureStore-backed last-read timestamps; `getUnreadCounts` queries Supabase |
| `context/UnreadContext.tsx` | Global unread state; realtime subscription; `refresh`, `markRead`, `setActiveMatch` |
| `services/notifications.ts` | Push token registration; notification response listener |
| `supabase/functions/send-push/` | Edge Function — Expo Push API delivery |
| `app/(tabs)/_layout.tsx` | `tabBarBadge` driven by `totalUnread` from context |
| `app/(tabs)/connect.tsx` | Per-row unread badge + bold name; calls `refresh` on load |
| `app/chat.tsx` | Calls `markRead` + `setActiveMatch` on enter; clears badge on every incoming message |

---

## 9. Known remaining limitations

| Limitation | Workaround |
|---|---|
| Push notifications require a dev/production build — not available in Expo Go | Build with `npx expo run:ios` or `eas build --profile development` |
| `send-push` edge function is called client-side after `sendMessage` — if the app crashes between the two, the notification is dropped | Move to a database trigger + edge function webhook for guaranteed delivery |
| Unread counts are stored in SecureStore per device — switching devices resets the "last read" position | Store `last_read_at` in a Supabase table (e.g. `match_read_receipts`) for cross-device sync |
| `unread-tracker` channel subscribes to all message inserts without a server-side filter | Acceptable at current user scale; at scale, filter by `match_id=in.(...)` or use user-scoped channels |

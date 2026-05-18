# SecureStore "User interaction is not allowed" Error

## The Error

```
ERROR  Auto refresh tick failed with error. This is likely a transient error.
[Error: Calling the 'getValueWithKeyAsync' function has failed
→ Caused by: User interaction is not allowed.]
```

This appears in the Metro console periodically, especially when the app transitions to the background.

---

## Root Cause

Supabase uses `expo-secure-store` as its session storage backend. Every few minutes it runs an **auto-refresh tick** to keep the auth token alive. That tick calls `SecureStore.getItemAsync()` to read the stored token.

By default, `expo-secure-store` stores keychain items with the `WHEN_UNLOCKED` accessibility level (iOS). This means the OS keychain **only allows reads while the device is actively unlocked and the app is in the foreground**. When the tick fires while the device is locked or the app is backgrounded, iOS blocks the read and throws the "User interaction is not allowed" error.

The full chain:

```
Supabase auth.autoRefreshToken = true
  → fires a refresh tick in the background
    → calls ExpoSecureStoreAdapter.getItem(key)
      → SecureStore.getItemAsync(key)          ← stored with WHEN_UNLOCKED
        → iOS: app is backgrounded / screen locked
          → throws "User interaction is not allowed"
```

---

## The Fix

Two changes were made to `services/supabase.ts`:

### 1. Use `AFTER_FIRST_UNLOCK` accessibility

Store tokens with `AFTER_FIRST_UNLOCK` instead of the default `WHEN_UNLOCKED`. This tells iOS to make the keychain item available after the user has unlocked the device at least once since boot — including while the app is in the background.

```ts
await SecureStore.setItemAsync(key, value, {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
});
```

### 2. Catch errors gracefully on all adapter methods

Tokens stored before this change still carry the old `WHEN_UNLOCKED` flag. For those, background reads will still fail until they are re-written. A try/catch on every adapter method ensures the error is swallowed instead of crashing the app — Supabase will automatically retry on the next tick.

```ts
getItem: async (key) => {
  try {
    return await SecureStore.getItemAsync(key, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  } catch {
    return null; // Supabase treats null as a transient miss and retries
  }
},
```

---

## Result

- New sessions store tokens with `AFTER_FIRST_UNLOCK` → background auto-refresh works silently.
- Old sessions (stored with `WHEN_UNLOCKED`) fail gracefully → error is caught, app does not crash, Supabase retries on the next tick.
- Once the user foregrounds the app and a successful refresh writes the new token, all future ticks use the correct accessibility level.

---

## Affected File

`services/supabase.ts` — `ExpoSecureStoreAdapter`

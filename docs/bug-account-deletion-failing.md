# Bug: Account Deletion Failing (Dashboard & In-App)

**Date:** 2026-05-19
**Severity:** Critical — users cannot delete their own accounts, violating privacy guarantees
**Files affected:**
- `services/account.ts`
- `app/(tabs)/profile.tsx`
- `supabase/functions/delete-account/index.ts`

---

## Symptoms

1. Deleting a user from the Supabase dashboard returned a `500 Database error deleting user`
2. Tapping "Delete account & all data" in the app appeared to do nothing — no error shown, no confirmation, user redirected to welcome screen but account still existed in Supabase

---

## Root Causes

### 1. Edge Function not deployed

`services/account.ts` calls a Supabase Edge Function `delete-account` to delete the `auth.users` row (requires service-role key, can't be done from the client). The function existed in the repo but had never been deployed to Supabase.

**Result:** Every call to the Edge Function failed silently. The fallback client-side wipe ran instead, but it couldn't delete the auth user — so the account persisted in Supabase even after all data rows were removed.

### 2. Fallback deletion missed tables and columns

The client-side fallback in `account.ts` only covered a subset of tables. Several tables with FK references to `auth.users` were not wiped before attempting auth user deletion, causing Postgres to reject the delete with a foreign key violation:

| Missing table | Missing column |
|---|---|
| `circle_members` | `user_id` |
| `circle_messages` | `sender_id` |
| `circle_reports` | `reporter_id` |
| `user_progress` | `user_id` |
| `blocks` | `blocked_id` (only `blocker_id` was covered) |
| `reports` | `reported_id` (only `reporter_id` was covered) |

### 3. Errors swallowed silently in the profile screen

`handleDeleteAccount` in `profile.tsx` only logged errors to the console:

```ts
// BEFORE — errors invisible to the user
if (result.errors.length > 0) {
  console.warn('deleteAccount finished with errors:', result.errors);
}
```

The user was always redirected to `/welcome` regardless of whether deletion succeeded, making it impossible to know something went wrong.

---

## Solution

### 1. Deploy the Edge Function

```bash
npx supabase functions deploy delete-account --no-verify-jwt=false
```

The `delete-account` function uses the service-role key to call `admin.auth.deleteUser(uid)`, which deletes the auth row and triggers Postgres CASCADE deletes on all dependent tables.

### 2. `services/account.ts` — cover all tables in the fallback

```ts
// AFTER — complete table coverage
const USER_TABLES_BY_USER_ID = ["circle_members", "user_progress", "check_ins", "journal_entries", "user_profiles"];
const USER_TABLES_BY_SENDER =  ["messages", "circle_messages"];
const USER_TABLES_BY_BLOCKER = ["blocks"];
const USER_TABLES_BY_BLOCKED = ["blocks"];          // ← was missing
const USER_TABLES_BY_REPORTER = ["reports", "circle_reports"];
const USER_TABLES_BY_REPORTED = ["reports"];        // ← was missing
```

### 3. `app/(tabs)/profile.tsx` — surface errors to the user

```ts
// AFTER — real error shown; navigation only on success
const result = await deleteAccount();
if (!result.authRowDeleted && result.errors.length > 0) {
  Alert.alert(
    'Could not delete account',
    result.errors.join('\n') + '\n\nYour local data was cleared.',
    [{ text: 'OK', onPress: () => { reset(); router.replace('/welcome'); } }]
  );
  return;
}
reset();
router.replace('/welcome');
```

---

## How to manually delete a stuck user (admin)

If a user can't be deleted through the dashboard or app, use the service-role key to clear their rows first, then delete the auth record:

```bash
USER_ID="<uuid>"
BASE="https://<project>.supabase.co/rest/v1"
KEY="<service-role-key>"

# Clear data rows (child tables first)
for TABLE in circle_messages circle_reports circle_members user_progress check_ins journal_entries; do
  curl -X DELETE "$BASE/$TABLE?user_id=eq.$USER_ID" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
done
curl -X DELETE "$BASE/messages?sender_id=eq.$USER_ID"   -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -X DELETE "$BASE/matches?requester_id=eq.$USER_ID" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -X DELETE "$BASE/matches?target_id=eq.$USER_ID"    -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -X DELETE "$BASE/blocks?blocker_id=eq.$USER_ID"    -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -X DELETE "$BASE/blocks?blocked_id=eq.$USER_ID"    -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -X DELETE "$BASE/reports?reporter_id=eq.$USER_ID"  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -X DELETE "$BASE/reports?reported_id=eq.$USER_ID"  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -X DELETE "$BASE/user_profiles?user_id=eq.$USER_ID" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"

# Delete auth user
curl -X DELETE "https://<project>.supabase.co/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

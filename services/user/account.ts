import * as SecureStore from "expo-secure-store";
import { deleteSensitiveData } from "../storage";
import { supabase } from "../supabase";

// Keys we want to wipe in addition to whatever deleteSensitiveData() handles.
// (deleteSensitiveData removes session, journal, safety plan, check-ins.)
const EXTRA_LOCAL_KEYS = [
  "hw_onboarding_complete",
  "hw_pin",
  "hw_disguise_enabled",
  "hw_disguise_style",
  "hw_bookmarks",
];

// Tables containing user-owned rows. Order matters: child rows first, then parents.
const USER_TABLES_BY_USER_ID = ["circle_members", "user_progress", "check_ins", "journal_entries", "user_profiles"];
const USER_TABLES_BY_REQUESTER = ["matches"];
const USER_TABLES_BY_SENDER = ["messages", "circle_messages"];
const USER_TABLES_BY_BLOCKER = ["blocks"];
const USER_TABLES_BY_BLOCKED = ["blocks"];
const USER_TABLES_BY_REPORTER = ["reports", "circle_reports"];
const USER_TABLES_BY_REPORTED = ["reports"];

export interface DeleteAccountResult {
  localCleared: boolean;
  remoteCleared: boolean;
  signedOut: boolean;
  authRowDeleted: boolean;
  errors: string[];
}

/**
 * Full account deletion:
 *  1. Invokes the `delete-account` Supabase Edge Function, which uses the
 *     service-role key to delete the caller's auth.users row. All tables
 *     with ON DELETE CASCADE (user_profiles, matches, messages, blocks,
 *     reports, check_ins, journal_entries) are wiped automatically.
 *  2. If the Edge Function is unavailable (offline, not deployed), falls
 *     back to a best-effort client-side wipe of user-owned rows.
 *  3. Signs the user out of Supabase.
 *  4. Wipes all sensitive SecureStore keys.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const result: DeleteAccountResult = {
    localCleared: false,
    remoteCleared: false,
    signedOut: false,
    authRowDeleted: false,
    errors: [],
  };

  if (supabase) {
    let uid: string | undefined;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      uid = user?.id;
    } catch (e: any) {
      result.errors.push(`getUser: ${e?.message ?? e}`);
    }

    if (uid) {
      // 1) Try the Edge Function (deletes auth.users; cascade wipes data).
      try {
        const { data, error } = await supabase.functions.invoke(
          "delete-account",
          { body: {} },
        );
        if (error) {
          result.errors.push(`edge: ${error.message}`);
        } else if (data?.deleted) {
          result.authRowDeleted = true;
          result.remoteCleared = true;
        }
      } catch (e: any) {
        result.errors.push(`edge: ${e?.message ?? e}`);
      }

      // 2) Fallback: best-effort client-side wipe if Edge Function failed.
      if (!result.authRowDeleted) {
        try {
          const sb = supabase;
          const ops: Promise<any>[] = [];
          const run = (b: any) => ops.push(Promise.resolve(b));
          USER_TABLES_BY_SENDER.forEach((t) =>
            run(sb.from(t).delete().eq("sender_id", uid!)),
          );
          USER_TABLES_BY_REPORTER.forEach((t) =>
            run(sb.from(t).delete().eq("reporter_id", uid!)),
          );
          USER_TABLES_BY_REPORTED.forEach((t) =>
            run(sb.from(t).delete().eq("reported_id", uid!)),
          );
          USER_TABLES_BY_BLOCKER.forEach((t) =>
            run(sb.from(t).delete().eq("blocker_id", uid!)),
          );
          USER_TABLES_BY_BLOCKED.forEach((t) =>
            run(sb.from(t).delete().eq("blocked_id", uid!)),
          );
          USER_TABLES_BY_REQUESTER.forEach((t) => {
            run(sb.from(t).delete().eq("requester_id", uid!));
            run(sb.from(t).delete().eq("target_id", uid!));
          });
          USER_TABLES_BY_USER_ID.forEach((t) =>
            run(sb.from(t).delete().eq("user_id", uid!)),
          );

          const settled = await Promise.allSettled(ops);
          let fallbackErrors = 0;
          settled.forEach((r) => {
            if (r.status === "rejected") {
              result.errors.push(String(r.reason));
              fallbackErrors++;
            } else if (r.value?.error) {
              result.errors.push(r.value.error.message);
              fallbackErrors++;
            }
          });
          result.remoteCleared = fallbackErrors === 0;
        } catch (e: any) {
          result.errors.push(`fallback: ${e?.message ?? e}`);
        }
      }
    } else {
      result.remoteCleared = true; // nothing to clear
    }

    // 3) Sign out regardless of outcome (Edge Function already invalidates,
    //    but this clears local Supabase session storage too).
    try {
      await supabase.auth.signOut();
      result.signedOut = true;
    } catch (e: any) {
      result.errors.push(`signOut: ${e?.message ?? e}`);
    }
  } else {
    result.remoteCleared = true;
    result.signedOut = true;
  }

  // 3) Local wipe.
  try {
    await deleteSensitiveData();
    await Promise.all(
      EXTRA_LOCAL_KEYS.map((k) => SecureStore.deleteItemAsync(k)),
    );
    result.localCleared = true;
  } catch (e: any) {
    result.errors.push(`local: ${e?.message ?? e}`);
  }

  return result;
}

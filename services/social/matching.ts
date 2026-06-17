import type { UserProfile } from "@/context/SessionContext";
import type { IntentionId, Match, PeerProfile } from "@/types";
import { currentUserId, supabase } from "../supabase";

import type { BlockedUser } from "@/types/social";

export async function getMatchPeerId(matchId: string): Promise<string | null> {
  if (!supabase) return null;
  const uid = await currentUserId();
  if (!uid) return null;

  const { data, error } = await supabase
    .from("matches")
    .select("requester_id, target_id")
    .eq("id", matchId)
    .single();
  if (error || !data) {
    console.error("Lookup match peer failed:", error?.message);
    return null;
  }
  return data.requester_id === uid ? data.target_id : data.requester_id;
}

export async function syncProfile(profile: UserProfile): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) {
    console.warn(
      "[syncProfile] No authenticated user — profile saved locally only",
    );
    return;
  }

  console.log(
    "[syncProfile] upserting for uid",
    uid,
    "intentions:",
    profile.intentions,
  );

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: uid,
      nickname: profile.nickname,
      age_range: profile.ageRange,
      language: profile.language,
      country: profile.country,
      hide_from_search: profile.hideFromSearch,
      needs: profile.needs,
      intentions: profile.intentions ?? [],
      avatar_url: profile.avatarUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[syncProfile] upsert failed:", error.message, error.code);
    throw new Error(error.message);
  }
  console.log("[syncProfile] upsert success for uid", uid);
}

export async function findMatches(
  intention: IntentionId,
  limit = 10,
): Promise<PeerProfile[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  // Exclude users the current user has acted on (as requester) AND users who
  // have acted on the current user (as target). This prevents the same pair
  // from appearing in multiple interests and creating duplicate matches.
  const [{ data: myActions }, { data: theirActions }, { data: blocked }] =
    await Promise.all([
      supabase.from("matches").select("target_id").eq("requester_id", uid).not("status", "in", "(passed)"),
      supabase.from("matches").select("requester_id").eq("target_id", uid),
      supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`),
    ]);

  const exclude = new Set<string>([uid]);
  (myActions ?? []).forEach((m: any) => exclude.add(m.target_id));
  (theirActions ?? []).forEach((m: any) => exclude.add(m.requester_id));
  (blocked ?? []).forEach((b: any) => {
    exclude.add(b.blocker_id);
    exclude.add(b.blocked_id);
  });

  const excludeArr = Array.from(exclude);

  // Build the filter query first (PostgrestFilterBuilder has .not()).
  // Apply .limit() last because PostgrestTransformBuilder (the result of .limit())
  // does not expose filter methods — calling .not() after .limit() would fail.
  let query = supabase
    .from("user_profiles")
    .select(
      "user_id, nickname, age_range, language, country, needs, intentions, avatar_url",
    )
    .eq("hide_from_search", false)
    .contains("intentions", [intention]);

  // Exclude all previously-acted-on / blocked users in a single NOT IN clause
  // rather than chaining one .neq() per user (which generates N separate SQL conditions).
  if (excludeArr.length > 0) {
    query = query.not("user_id", "in", `(${excludeArr.join(",")})`);
  }

  const { data, error } = await query.limit(limit);
  if (error) {
    console.error("Find matches failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    userId: row.user_id,
    nickname: row.nickname,
    ageRange: row.age_range ?? undefined,
    language: row.language ?? undefined,
    country: row.country ?? undefined,
    needs: row.needs ?? [],
    avatarUrl: row.avatar_url ?? undefined,
  }));
}

export async function connectMatch(
  targetId: string,
  intention: IntentionId,
): Promise<{ matchId: string | null; mutual: boolean }> {
  if (!supabase) return { matchId: null, mutual: false };
  const uid = await currentUserId();
  if (!uid) return { matchId: null, mutual: false };

  // Check if the target has already liked the current user (pending row from them → us)
  const { data: pending } = await supabase
    .from("matches")
    .select("id")
    .eq("requester_id", targetId)
    .eq("target_id", uid)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) {
    // Mutual match — upgrade the existing pending row to accepted
    const { error } = await supabase
      .from("matches")
      .update({ status: "accepted" })
      .eq("id", pending.id);
    if (error) {
      console.error("Connect (mutual) failed:", error.message);
      return { matchId: null, mutual: false };
    }
    return { matchId: pending.id, mutual: true };
  }

  // One-sided like — upsert so re-liking a previously passed user updates the existing row
  const { error } = await supabase.from("matches").upsert(
    { requester_id: uid, target_id: targetId, intention, status: "pending" },
    { onConflict: "requester_id,target_id" },
  );

  if (error) {
    console.error("Connect failed:", error.message);
    return { matchId: null, mutual: false };
  }

  // Notify the target that they received a like — ignore failures.
  supabase.functions
    .invoke("send-push", { body: { type: "like", targetId } })
    .catch(() => {});

  return { matchId: null, mutual: false };
}

export async function passMatch(
  targetId: string,
  intention: IntentionId,
): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;

  const { error } = await supabase.from("matches").upsert(
    { requester_id: uid, target_id: targetId, intention, status: "passed" },
    { onConflict: "requester_id,target_id" },
  );
  if (error) console.error("Pass failed:", error.message);
}

async function matchesWithProfiles(rows: any[], uid: string): Promise<Match[]> {
  if (!supabase || rows.length === 0) return [];
  const peerIds = rows.map((r) =>
    r.requester_id === uid ? r.target_id : r.requester_id,
  );
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select(
      "user_id, nickname, age_range, language, country, needs, avatar_url",
    )
    .in("user_id", peerIds);
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

  return rows.map((row: any) => {
    const peerId = row.requester_id === uid ? row.target_id : row.requester_id;
    const p = profileMap.get(peerId) as any;
    return {
      id: row.id,
      requesterId: row.requester_id,
      targetId: row.target_id,
      intention: row.intention,
      status: row.status,
      createdAt: row.created_at,
      peer: p
        ? {
            userId: p.user_id,
            nickname: p.nickname,
            ageRange: p.age_range ?? undefined,
            language: p.language ?? undefined,
            country: p.country ?? undefined,
            needs: p.needs ?? [],
            avatarUrl: p.avatar_url ?? undefined,
          }
        : undefined,
    };
  });
}

// Mutual accepted matches — either side can have been the original requester
export async function getMyMatches(): Promise<Match[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("matches")
    .select("id, requester_id, target_id, intention, status, created_at")
    .or(`requester_id.eq.${uid},target_id.eq.${uid}`)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get matches failed:", error.message);
    return [];
  }
  return matchesWithProfiles(data ?? [], uid);
}

// Likes the current user sent that are still waiting for a response
export async function getPendingOutgoing(): Promise<Match[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("matches")
    .select("id, requester_id, target_id, intention, status, created_at")
    .eq("requester_id", uid)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get pending outgoing failed:", error.message);
    return [];
  }
  return matchesWithProfiles(data ?? [], uid);
}

// Likes from others that are waiting for the current user to respond
export async function getIncomingLikes(): Promise<Match[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("matches")
    .select("id, requester_id, target_id, intention, status, created_at")
    .eq("target_id", uid)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get incoming likes failed:", error.message);
    return [];
  }
  return matchesWithProfiles(data ?? [], uid);
}

// Accept an incoming like → mutual match, chat unlocked
export async function acceptIncomingLike(matchId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("matches")
    .update({ status: "accepted" })
    .eq("id", matchId);
  if (error) {
    console.error("Accept like failed:", error.message);
    return false;
  }
  return true;
}

// Decline an incoming like → no match, no chat
export async function declineIncomingLike(matchId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("matches")
    .update({ status: "passed" })
    .eq("id", matchId);
  if (error) console.error("Decline like failed:", error.message);
}

// Cancel an outgoing pending request — only the requester can do this
export async function cancelPendingMatch(matchId: string): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("requester_id", uid)
    .eq("status", "pending");
  if (error) {
    console.error("Cancel pending failed:", error.message);
    return false;
  }
  return true;
}

// All users the current user has passed on or declined (status = passed), either as requester or target
export async function getDeclinedPeers(): Promise<Match[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("matches")
    .select("id, requester_id, target_id, intention, status, created_at")
    .or(`requester_id.eq.${uid},target_id.eq.${uid}`)
    .eq("status", "passed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get declined peers failed:", error.message);
    return [];
  }
  return matchesWithProfiles(data ?? [], uid);
}

// Unmatch an accepted connection — either participant can do this
export async function unmatch(matchId: string): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .or(`requester_id.eq.${uid},target_id.eq.${uid}`);
  if (error) {
    console.error("Unmatch failed:", error.message);
    return false;
  }
  return true;
}

export async function blockUser(
  targetId: string,
  matchId?: string,
): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  if (uid === targetId) {
    console.error("Block failed: cannot block yourself");
    return false;
  }

  // Upsert so re-blocking the same user is a no-op instead of a unique-constraint error.
  const { error: blockError } = await supabase
    .from("blocks")
    .upsert(
      { blocker_id: uid, blocked_id: targetId },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
    );
  if (blockError) {
    console.error("Block failed:", blockError.message);
    return false;
  }

  if (matchId) {
    const { error: matchError } = await supabase
      .from("matches")
      .update({ status: "blocked" })
      .eq("id", matchId);
    if (matchError) {
      console.error(
        "Block: failed to update match status:",
        matchError.message,
      );
      // Block itself succeeded — still return true.
    }
  }

  return true;
}

export async function unblockUser(targetId: string): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUserId();
  if (!uid) return false;

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", uid)
    .eq("blocked_id", targetId);
  if (error) {
    console.error("Unblock failed:", error.message);
    return false;
  }
  return true;
}

export async function getBlockedUserIds(): Promise<string[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", uid);
  if (error) {
    console.error("Get blocked users failed:", error.message);
    return [];
  }
  return (data ?? []).map((row: any) => row.blocked_id);
}

export type { BlockedUser };

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data: blocks, error } = await supabase
    .from("blocks")
    .select("blocked_id, created_at")
    .eq("blocker_id", uid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get blocked users failed:", error.message);
    return [];
  }
  if (!blocks || blocks.length === 0) return [];

  const ids = blocks.map((b: any) => b.blocked_id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, nickname")
    .in("user_id", ids);

  const nameMap = new Map(
    (profiles ?? []).map((p: any) => [p.user_id, p.nickname]),
  );

  return blocks.map((b: any) => ({
    userId: b.blocked_id,
    nickname: nameMap.get(b.blocked_id) ?? "Anonymous",
    createdAt: b.created_at,
  }));
}

export async function reportUser(
  targetId: string,
  reason: string,
): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;

  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: uid, reported_id: targetId, reason });
  if (error) console.error("Report user failed:", error.message);
}

export async function reportMessage(
  messageId: string,
  targetId: string,
  reason: string,
): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;

  const { error } = await supabase.from("reports").insert({
    reporter_id: uid,
    reported_id: targetId,
    message_id: messageId,
    reason,
  });
  if (error) console.error("Report message failed:", error.message);
}

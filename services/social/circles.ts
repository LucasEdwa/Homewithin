import type { Circle, CircleMessage, CircleMember } from "@/types";
import { currentUserId, supabase } from "../supabase";

type MemberInfo = { nickname: string; avatarUrl?: string };

function rowToMessage(
  row: any,
  memberMap?: Map<string, MemberInfo>,
): CircleMessage {
  const info = memberMap?.get(row.sender_id);
  return {
    id: row.id,
    circleId: row.circle_id,
    senderId: row.sender_id,
    senderNickname: info?.nickname,
    senderAvatarUrl: info?.avatarUrl,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function listCircles(): Promise<Circle[]> {
  if (!supabase) return [];
  const uid = await currentUserId();

  // member_count is a denormalized column maintained by a SECURITY DEFINER
  // trigger — no separate circle_members count query needed.
  const { data: circles, error } = await supabase
    .from("circles")
    .select(
      "id, slug, name, description, rules, category, member_cap, member_count, created_at",
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("List circles failed:", error.message);
    return [];
  }
  if (!circles || circles.length === 0) return [];

  // The SELECT policy on circle_members is now `auth.uid() = user_id`, so a
  // single query returns only the current user's own membership rows — no recursion.
  let myMemberships: { circle_id: string; intro_seen: boolean }[] = [];
  if (uid) {
    const { data } = await supabase
      .from("circle_members")
      .select("circle_id, intro_seen")
      .eq("user_id", uid);
    myMemberships = data ?? [];
  }
  const myMap = new Map(myMemberships.map((m) => [m.circle_id, m.intro_seen]));

  return circles.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    rules: c.rules,
    category: c.category ?? undefined,
    memberCap: c.member_cap,
    memberCount: c.member_count ?? 0,
    isMember: myMap.has(c.id),
    introSeen: myMap.get(c.id) ?? false,
    createdAt: c.created_at,
  }));
}

export async function getCircle(circleId: string): Promise<Circle | null> {
  if (!supabase) return null;
  const uid = await currentUserId();

  const { data: c, error } = await supabase
    .from("circles")
    .select(
      "id, slug, name, description, rules, category, member_cap, member_count, created_at",
    )
    .eq("id", circleId)
    .single();

  if (error || !c) {
    console.error("Get circle failed:", error?.message);
    return null;
  }

  let introSeen = false;
  let isMember = false;
  if (uid) {
    const { data: mem } = await supabase
      .from("circle_members")
      .select("intro_seen")
      .eq("circle_id", circleId)
      .eq("user_id", uid)
      .maybeSingle();
    if (mem) {
      isMember = true;
      introSeen = mem.intro_seen;
    }
  }

  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    rules: c.rules,
    category: c.category ?? undefined,
    memberCap: c.member_cap,
    memberCount: c.member_count ?? 0,
    isMember,
    introSeen,
    createdAt: c.created_at,
  };
}

export type JoinCircleResult =
  | { ok: true }
  | { ok: false; reason: "full" | "auth" | "unknown" };

export async function joinCircle(circleId: string): Promise<JoinCircleResult> {
  if (!supabase) return { ok: false, reason: "unknown" };
  const uid = await currentUserId();
  if (!uid) return { ok: false, reason: "auth" };

  const { error } = await supabase
    .from("circle_members")
    .insert({ circle_id: circleId, user_id: uid });

  if (error) {
    // The DB trigger throws "Circle is full" — surface that to the UI.
    if (error.message?.toLowerCase().includes("full")) {
      return { ok: false, reason: "full" };
    }
    // Already a member is treated as success.
    if (error.code === "23505") return { ok: true };
    console.error("Join circle failed:", error.message);
    return { ok: false, reason: "unknown" };
  }
  return { ok: true };
}

export async function leaveCircle(circleId: string): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUserId();
  if (!uid) return false;

  const { error } = await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", uid);

  if (error) {
    console.error("Leave circle failed:", error.message);
    return false;
  }
  return true;
}

export async function markCircleIntroSeen(circleId: string): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;
  await supabase
    .from("circle_members")
    .update({ intro_seen: true })
    .eq("circle_id", circleId)
    .eq("user_id", uid);
}

async function fetchMemberMap(
  circleId: string,
): Promise<Map<string, MemberInfo>> {
  if (!supabase) return new Map();
  // circle_members SELECT RLS is locked to auth.uid() = user_id (to prevent
  // recursion), so querying it directly would only return the current user's
  // row. The SECURITY DEFINER RPC bypasses that safely while still requiring
  // the caller to be a member of the circle.
  const { data: profiles, error } = await supabase.rpc(
    "get_circle_member_profiles",
    { p_circle_id: circleId },
  );
  if (error) {
    console.error("fetchMemberMap rpc failed:", error.message);
    return new Map();
  }
  return new Map(
    (profiles ?? []).map((p: any) => [
      p.user_id,
      { nickname: p.nickname ?? "Unknown", avatarUrl: p.avatar_url ?? undefined },
    ]),
  );
}

export async function getCircleMembers(circleId: string): Promise<CircleMember[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  const map = await fetchMemberMap(circleId);
  return Array.from(map.entries()).map(([userId, info]) => ({
    userId,
    nickname: info.nickname,
    avatarUrl: info.avatarUrl,
    isMe: userId === uid,
  }));
}

export async function getCircleMessages(
  circleId: string,
): Promise<CircleMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("circle_messages")
    .select("*")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Get circle messages failed:", error.message);
    return [];
  }
  const nicknames = await fetchMemberMap(circleId);
  return (data ?? []).map((row: any) => rowToMessage(row, nicknames));
}

export async function sendCircleMessage(
  circleId: string,
  body: string,
): Promise<CircleMessage | null> {
  if (!supabase) return null;
  const uid = await currentUserId();
  if (!uid) return null;

  const { data, error } = await supabase
    .from("circle_messages")
    .insert({ circle_id: circleId, sender_id: uid, body })
    .select()
    .single();

  if (error) {
    console.error("Send circle message failed:", error.message);
    return null;
  }
  return rowToMessage(data);
}

export function subscribeToCircleMessages(
  circleId: string,
  onMessage: (msg: CircleMessage) => void,
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`circle_messages:${circleId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "circle_messages",
        filter: `circle_id=eq.${circleId}`,
      },
      (payload) => onMessage(rowToMessage(payload.new as any)),
    )
    .subscribe();

  return () => {
    supabase!.removeChannel(channel);
  };
}

export async function reportInCircle(
  circleId: string,
  reason: string,
  opts: { messageId?: string; reportedUserId?: string } = {},
): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;

  const { error } = await supabase.from("circle_reports").insert({
    reporter_id: uid,
    circle_id: circleId,
    message_id: opts.messageId ?? null,
    reported_id: opts.reportedUserId ?? null,
    reason,
  });
  if (error) console.error("Circle report failed:", error.message);
}

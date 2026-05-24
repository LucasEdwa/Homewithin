import type { Message } from "@/types";
import { supabase } from "../supabase";

type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  expires_at: string | null;
  created_at: string;
};

const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "want to die",
  "hurt myself",
  "self harm",
  "selfharm",
  "overdose",
  "cutting myself",
  "no reason to live",
  "can't go on",
  "cannot go on",
  "end it all",
];

export function containsCrisisKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    body: row.body,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function sendMessage(
  matchId: string,
  body: string,
  disappearing: boolean,
): Promise<Message | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!user) return null;

  const expiresAt = disappearing
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: user.id,
      body,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error("Send message failed:", error.message);
    return null;
  }

  // Fire push notification to the other participant — ignore failures so chat still works.
  supabase.functions
    .invoke("send-push", { body: { matchId, body } })
    .catch(() => {});

  return rowToMessage(data);
}

export async function getMessages(matchId: string): Promise<Message[]> {
  if (!supabase) return [];

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Get messages failed:", error.message);
    return [];
  }
  return (data ?? []).map(rowToMessage);
}

export function subscribeToMessages(
  matchId: string,
  onMessage: (msg: Message) => void,
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        const row = payload.new as any;
        if (row.expires_at && new Date(row.expires_at) < new Date()) return;
        onMessage(rowToMessage(row));
      },
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR")
        console.warn(
          "[chat] realtime subscription error — check messages table is in supabase_realtime publication",
        );
      if (status === "TIMED_OUT")
        console.warn("[chat] realtime subscription timed out");
    });

  return () => {
    supabase!.removeChannel(channel);
  };
}

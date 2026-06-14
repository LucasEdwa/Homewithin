import type { Message } from "@/types";
import { supabase } from "../supabase";

type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  expires_at: string | null;
  created_at: string;
  liked: boolean | null;
  reply_to_id: string | null;
  reply_to_body: string | null;
  reply_to_sender_id: string | null;
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
    liked: row.liked ?? false,
    replyToId: row.reply_to_id ?? undefined,
    replyToBody: row.reply_to_body ?? undefined,
    replyToSenderId: row.reply_to_sender_id ?? undefined,
  };
}

export async function sendMessage(
  matchId: string,
  body: string,
  expiryHours: number | null,
  replyTo?: { id: string; body: string; senderId: string },
): Promise<Message | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!user) return null;

  const expiresAt = expiryHours != null
    ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: user.id,
      body,
      expires_at: expiresAt,
      reply_to_id: replyTo?.id ?? null,
      reply_to_body: replyTo?.body ?? null,
      reply_to_sender_id: replyTo?.senderId ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Send message failed:", error.message);
    return null;
  }

  supabase.functions
    .invoke("send-push", { body: { matchId, body } })
    .catch(() => {});

  return rowToMessage(data);
}

export async function getMessages(matchId: string): Promise<Message[]> {
  if (!supabase) return [];

  const now = new Date().toISOString();
  // Fetch newest 100 non-expired messages (descending so .limit keeps the right end),
  // then reverse to chronological order for display.
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Get messages failed:", error.message);
    return [];
  }
  return (data ?? []).reverse().map(rowToMessage);
}

export async function toggleMessageLike(
  messageId: string,
  currentlyLiked: boolean,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from("messages")
    .update({ liked: !currentlyLiked })
    .eq("id", messageId);

  if (error) {
    console.error("Toggle like failed:", error.message);
    return false;
  }
  return true;
}

export function subscribeToMessages(
  matchId: string,
  onMessage: (msg: Message) => void,
  onMessageUpdated: (msg: Message) => void,
  onError?: () => void,
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
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        const row = payload.new as any;
        onMessageUpdated(rowToMessage(row));
      },
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.warn("[chat] realtime subscription error — check messages table is in supabase_realtime publication");
        // Re-fetch to catch any messages missed while the channel was down.
        onError?.();
      }
      if (status === "TIMED_OUT") {
        console.warn("[chat] realtime subscription timed out");
        onError?.();
      }
    });

  return () => {
    supabase!.removeChannel(channel);
  };
}

export async function applyExpiryToMatch(
  matchId: string,
  expiryHours: number,
): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!user) return false;

  const expiresAt = new Date(
    Date.now() + expiryHours * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase
    .from('messages')
    .update({ expires_at: expiresAt })
    .eq('match_id', matchId)
    .eq('sender_id', user.id);

  if (error) {
    console.error('Apply expiry to match failed:', error.message);
    return false;
  }
  return true;
}

export async function getLastMessagesByMatchIds(
  matchIds: string[],
): Promise<Record<string, { body: string; createdAt: string; senderId: string }>> {
  if (!supabase || matchIds.length === 0) return {};
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("messages")
    .select("match_id, body, created_at, sender_id")
    .in("match_id", matchIds)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(matchIds.length * 5);

  if (error) {
    console.error("Get last messages failed:", error.message);
    return {};
  }

  const result: Record<string, { body: string; createdAt: string; senderId: string }> = {};
  for (const row of data ?? []) {
    if (!result[row.match_id]) {
      result[row.match_id] = { body: row.body, createdAt: row.created_at, senderId: row.sender_id };
    }
  }
  return result;
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!user) return false;

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) {
    console.error("Delete message failed:", error.message);
    return false;
  }
  return true;
}

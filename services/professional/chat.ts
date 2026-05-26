import { getClient } from "@/services/supabase";
import type { SessionMessage } from "@/types/professional";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CRISIS_KEYWORDS = [
  "suicid",
  "kill myself",
  "want to die",
  "end my life",
  "self harm",
  "hurt myself",
  "can't go on",
  "no reason to live",
  "overdose",
];

export function containsCrisisKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function mapRow(row: Record<string, unknown>): SessionMessage {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    senderId: row.sender_id as string,
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

export async function getSessionMessages(
  sessionId: string,
): Promise<SessionMessage[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("session_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function sendSessionMessage(
  sessionId: string,
  body: string,
): Promise<SessionMessage> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("session_messages")
    .insert({ session_id: sessionId, sender_id: user.id, body })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export function subscribeToSessionMessages(
  sessionId: string,
  onMessage: (message: SessionMessage) => void,
): () => void {
  const supabase = getClient();
  const channel: RealtimeChannel = supabase
    .channel(`session-messages:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "session_messages",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => onMessage(mapRow(payload.new as Record<string, unknown>)),
    )
    .subscribe();

  return () => {
    getClient().removeChannel(channel);
  };
}

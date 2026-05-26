import { getClient } from "@/services/supabase";
import type { SessionNote, UpsertSessionNoteInput } from "@/types/professional";

function mapRow(row: Record<string, unknown>): SessionNote {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    professionalId: row.professional_id as string,
    userId: row.user_id as string,
    body: row.body as string,
    isSharedWithAi: row.is_shared_with_ai as boolean,
    createdAt: row.created_at as string,
  };
}

/** Get the note for a specific session. Returns null if none exists yet. */
export async function getSessionNote(
  sessionId: string,
): Promise<SessionNote | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("session_notes")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (error) return null;
  return mapRow(data);
}

/** Create or update the note for a session (one note per session). Professional-only. */
export async function upsertNote(
  input: UpsertSessionNoteInput,
): Promise<SessionNote> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify the session belongs to this professional
  const { data: session, error: sessionError } = await supabase
    .from("professional_sessions")
    .select("user_id")
    .eq("id", input.sessionId)
    .eq("professional_id", user.id)
    .single();

  if (sessionError || !session)
    throw new Error("Session not found or not authorised.");

  const { data, error } = await supabase
    .from("session_notes")
    .upsert(
      {
        session_id: input.sessionId,
        professional_id: user.id,
        user_id: session.user_id,
        body: input.body,
        is_shared_with_ai: input.isSharedWithAi,
      },
      { onConflict: "session_id" },
    )
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

/**
 * Returns all notes shared with the AI for a given user.
 * Used by the AI companion's UserContext builder.
 */
export async function getSharedNotes(userId: string): Promise<SessionNote[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("session_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("is_shared_with_ai", true)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapRow);
}

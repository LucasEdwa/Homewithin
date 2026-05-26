import {
    MAX_PENDING_BOOKINGS,
    SESSION_DURATION_MINUTES,
} from "@/constants/ProfessionalSupport";
import { getClient } from "@/services/supabase";
import type { BookingStatus, ProfessionalSession } from "@/types/professional";

function mapRow(row: Record<string, unknown>): ProfessionalSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    professionalId: row.professional_id as string,
    scheduledAt: row.scheduled_at as string,
    durationMinutes: row.duration_minutes as number,
    status: row.status as BookingStatus,
    stripePaymentIntentId: row.stripe_payment_intent_id as string | undefined,
    stripePaymentStatus:
      row.stripe_payment_status as ProfessionalSession["stripePaymentStatus"],
    createdAt: row.created_at as string,
    professional: row.professional_profiles
      ? {
          displayName: (row.professional_profiles as Record<string, unknown>)
            .display_name as string,
          title: (row.professional_profiles as Record<string, unknown>)
            .title as string,
          avatarUrl: (row.professional_profiles as Record<string, unknown>)
            .avatar_url as string | undefined,
        }
      : undefined,
  };
}

/** Create a new pending booking for the current user. */
export async function bookSession(
  professionalId: string,
  scheduledAt: string,
): Promise<ProfessionalSession> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Enforce max pending bookings
  const { count } = await supabase
    .from("professional_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date().toISOString());

  if ((count ?? 0) >= MAX_PENDING_BOOKINGS) {
    throw new Error(
      `You can only have ${MAX_PENDING_BOOKINGS} active bookings at a time.`,
    );
  }

  // Reject past slots
  if (new Date(scheduledAt) <= new Date()) {
    throw new Error("Cannot book a session in the past.");
  }

  const endsAt = new Date(
    new Date(scheduledAt).getTime() + SESSION_DURATION_MINUTES * 60 * 1000,
  ).toISOString();
  void endsAt; // stored implicitly via duration_minutes

  const { data, error } = await supabase
    .from("professional_sessions")
    .insert({
      user_id: user.id,
      professional_id: professionalId,
      scheduled_at: scheduledAt,
      duration_minutes: SESSION_DURATION_MINUTES,
      status: "pending",
    })
    .select("*, professional_profiles(display_name, title, avatar_url)")
    .single();

  if (error) throw error;
  return mapRow(data);
}

/** Fetch all sessions for the current user (as patient), newest first. */
export async function getUserSessions(): Promise<ProfessionalSession[]> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("professional_sessions")
    .select("*, professional_profiles(display_name, title, avatar_url)")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Fetch all sessions for the current user (as professional), newest first. */
export async function getProfessionalSessions(): Promise<
  ProfessionalSession[]
> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("professional_sessions")
    .select("*, professional_profiles(display_name, title, avatar_url)")
    .eq("professional_id", user.id)
    .order("scheduled_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Cancel a session. Only allowed when >24h before scheduled_at. */
export async function cancelSession(sessionId: string): Promise<void> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: session, error: fetchError } = await supabase
    .from("professional_sessions")
    .select("scheduled_at, status, user_id")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) throw new Error("Session not found.");
  if (session.user_id !== user.id)
    throw new Error("Not authorised to cancel this session.");
  if (session.status === "cancelled")
    throw new Error("Session is already cancelled.");
  if (session.status === "completed")
    throw new Error("Cannot cancel a completed session.");

  const hoursUntil =
    (new Date(session.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 24) {
    throw new Error(
      "Sessions cannot be cancelled less than 24 hours before start time.",
    );
  }

  const { error } = await supabase
    .from("professional_sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId);

  if (error) throw error;
}

/** Confirm a session after successful Stripe payment. Called by the payments service. */
export async function confirmSession(
  sessionId: string,
  paymentIntentId: string,
): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase
    .from("professional_sessions")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: paymentIntentId,
      stripe_payment_status: "paid",
    })
    .eq("id", sessionId);

  if (error) throw error;
}

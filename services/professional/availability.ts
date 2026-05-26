import { SESSION_DURATION_MINUTES } from "@/constants/ProfessionalSupport";
import { getClient } from "@/services/supabase";
import type {
    AvailabilitySlot,
    DayOfWeek,
    OpenSlot,
} from "@/types/professional";

function mapRow(row: Record<string, unknown>): AvailabilitySlot {
  return {
    id: row.id as string,
    professionalId: row.professional_id as string,
    dayOfWeek: row.day_of_week as DayOfWeek,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    isActive: row.is_active as boolean,
  };
}

export async function getAvailability(
  professionalId: string,
): Promise<AvailabilitySlot[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("professional_availability")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/**
 * Returns open (unbookable) slots for the next `weeksAhead` weeks for a professional.
 * Excludes slots already occupied by confirmed/pending sessions.
 */
export async function getOpenSlots(
  professionalId: string,
  weeksAhead = 2,
): Promise<OpenSlot[]> {
  const supabase = getClient();
  const availability = await getAvailability(professionalId);
  if (availability.length === 0) return [];

  // Fetch already-booked slots in the window
  const windowStart = new Date();
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + weeksAhead * 7);

  const { data: booked } = await supabase
    .from("professional_sessions")
    .select("scheduled_at")
    .eq("professional_id", professionalId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  const bookedTimes = new Set(
    (booked ?? []).map((r: { scheduled_at: string }) => r.scheduled_at),
  );

  const openSlots: OpenSlot[] = [];

  for (let d = 0; d < weeksAhead * 7; d++) {
    const date = new Date(windowStart);
    date.setDate(date.getDate() + d);
    const dayOfWeek = date.getDay() as DayOfWeek;

    const daySlots = availability.filter((a) => a.dayOfWeek === dayOfWeek);
    for (const slot of daySlots) {
      const [startHour, startMin] = slot.startTime.split(":").map(Number);
      const [endHour, endMin] = slot.endTime.split(":").map(Number);

      const slotStart = new Date(date);
      slotStart.setHours(startHour, startMin, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(endHour, endMin, 0, 0);

      // Skip slots in the past
      if (slotStart <= new Date()) continue;

      // Generate session-length slots within the availability window
      const current = new Date(slotStart);
      while (
        current.getTime() + SESSION_DURATION_MINUTES * 60 * 1000 <=
        slotEnd.getTime()
      ) {
        const sessionEnd = new Date(
          current.getTime() + SESSION_DURATION_MINUTES * 60 * 1000,
        );
        const isoStart = current.toISOString();

        if (!bookedTimes.has(isoStart)) {
          openSlots.push({
            professionalId,
            startsAt: isoStart,
            endsAt: sessionEnd.toISOString(),
          });
        }
        current.setMinutes(current.getMinutes() + SESSION_DURATION_MINUTES);
      }
    }
  }

  return openSlots;
}

export async function setAvailability(
  professionalId: string,
  slots: Omit<AvailabilitySlot, "id" | "professionalId">[],
): Promise<void> {
  const supabase = getClient();
  // Replace all availability for this professional
  await supabase
    .from("professional_availability")
    .delete()
    .eq("professional_id", professionalId);

  if (slots.length === 0) return;

  const { error } = await supabase.from("professional_availability").insert(
    slots.map((s) => ({
      professional_id: professionalId,
      day_of_week: s.dayOfWeek,
      start_time: s.startTime,
      end_time: s.endTime,
      is_active: s.isActive,
    })),
  );

  if (error) throw error;
}

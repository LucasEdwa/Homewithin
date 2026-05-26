// ─── Professional Support Types ───────────────────────────────────────────────

/**
 * Specialties map directly to the app's existing topic taxonomy so that
 * professionals can be filtered by the same situations the app surfaces.
 */
export type Specialty =
  | "family_rejection"
  | "coming_out"
  | "trans_identity"
  | "grief"
  | "anxiety"
  | "internalized_shame"
  | "religious_trauma"
  | "relationships"
  | "general"
  | "therapist"
  | "coach"
  | "social_worker"
  | "counselor"
  | "psychiatrist"
  | "mentor";

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  family_rejection: "Family Rejection",
  coming_out: "Coming Out",
  trans_identity: "Trans Identity",
  grief: "Grief & Loss",
  anxiety: "Anxiety",
  internalized_shame: "Internalized Shame",
  religious_trauma: "Religious Trauma",
  relationships: "Relationships",
  general: "General Support",
  therapist: "Therapist",
  coach: "Coach",
  social_worker: "Social Worker",
  counselor: "Counselor",
  psychiatrist: "Psychiatrist",
  mentor: "Mentor",
};

// ─── Professional Profile ────────────────────────────────────────────────────

export interface ProfessionalProfile {
  id: string; // uuid — matches auth.users id
  displayName: string;
  title: string; // e.g. "Licensed Psychologist"
  bio: string;
  specialties: Specialty[];
  languages: string[];
  licenseNumber: string;
  licenseVerified: boolean;
  avatarUrl?: string;
  sessionPriceSekOre: number; // price in öre (1 SEK = 100 öre)
  isActive: boolean;
  createdAt: string;
}

export interface CreateProfessionalProfileInput {
  displayName: string;
  title: string;
  bio: string;
  specialties: Specialty[];
  languages: string[];
  licenseNumber: string;
  sessionPriceSekOre: number;
}

// ─── Availability ────────────────────────────────────────────────────────────

/** 0 = Sunday … 6 = Saturday (matches JS Date.getDay()) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AvailabilitySlot {
  id: string;
  professionalId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  isActive: boolean;
}

/** A concrete bookable time slot derived from availability for a given date. */
export interface OpenSlot {
  professionalId: string;
  startsAt: string; // ISO 8601 datetime
  endsAt: string;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending" // created, payment not yet completed
  | "confirmed" // payment succeeded
  | "completed" // session has passed
  | "cancelled"; // cancelled by user or professional

export type StripePaymentStatus = "unpaid" | "paid" | "refunded";

export interface ProfessionalSession {
  id: string;
  userId: string;
  professionalId: string;
  scheduledAt: string; // ISO 8601
  durationMinutes: number;
  status: BookingStatus;
  stripePaymentIntentId?: string;
  stripePaymentStatus: StripePaymentStatus;
  createdAt: string;
  // Joined fields (optional, populated by queries)
  professional?: Pick<
    ProfessionalProfile,
    "displayName" | "title" | "avatarUrl"
  >;
}

// ─── Session Messages ────────────────────────────────────────────────────────

export interface SessionMessage {
  id: string;
  sessionId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

// ─── Session Notes ───────────────────────────────────────────────────────────

export interface SessionNote {
  id: string;
  sessionId: string;
  professionalId: string;
  userId: string;
  body: string;
  isSharedWithAi: boolean;
  createdAt: string;
}

export interface UpsertSessionNoteInput {
  sessionId: string;
  body: string;
  isSharedWithAi: boolean;
}

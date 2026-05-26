// ─── Professional Support — Feature Constants ─────────────────────────────────
// Update these before flipping the beta flag to true.

/** Set to true to unlock the Professional Support tab for all users. */
export const PROFESSIONAL_SUPPORT_BETA_ENABLED = true;

/** ISO 4217 currency code used for all session payments. */
export const PLATFORM_CURRENCY = "sek" as const;

/**
 * Percentage HomeWithin retains from each session payment.
 * Applied server-side in the create-payment-intent Edge Function.
 * TBD — set before launch.
 */
export const PLATFORM_COMMISSION_PERCENT = 20;

/** Default session length in minutes shown in booking UI. */
export const SESSION_DURATION_MINUTES = 50;

/**
 * Minimum session price a professional can set, in öre (1 SEK = 100 öre).
 * TBD — set before launch.
 */
export const SESSION_MIN_PRICE_SEK_ORE = 0;

/** Base URL for Jitsi Meet rooms. Each session uses homewithin-{sessionId}. */
export const JITSI_BASE_URL = "https://meet.jit.si";

/**
 * URL of the Next.js professional portal web app.
 * Update to the Vercel production URL before launch.
 */
export const PROFESSIONAL_PORTAL_URL = "https://portal.homewithin.app";

/** How many minutes before/after scheduled_at the video call join button is active. */
export const VIDEO_JOIN_WINDOW_MINUTES = 30;

/** Maximum number of pending (unpaid) bookings a user can hold at once. */
export const MAX_PENDING_BOOKINGS = 3;

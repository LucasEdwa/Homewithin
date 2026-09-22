/**
 * Client-side content filter for clearly objectionable content.
 * Acts as a first line of defence before content reaches the database.
 * Server-side moderation (reports reviewed within 24 h) handles the rest.
 */

// Each pattern is tested case-insensitively against the full message text.

// Tier 1 — hard block: severe slurs, threats, illegal content.
const OBJECTIONABLE: RegExp[] = [
  // Homophobic / transphobic slurs
  /\bf[a4@]gg?[o0]?t?s?\b/i,
  /\bdyk[e3]s?\b/i,
  /\btran+y\b/i,
  /\bsh[e3]males?\b/i,

  // Racial slurs
  /\bn[i1!]gg[ae3@]r?s?\b/i,
  /\bsp[i1!]ck?s?\b/i,
  /\bk[i1!]k[e3]s?\b/i,
  /\bch[i1!]nk?s?\b/i,

  // Direct violence threats toward another person
  /\bi('ll| will| am going to)\s+(kill|rape|hurt|stab|shoot)\s+(you|u)\b/i,

  // Illegal material
  /child\s*(porn|sex|nude|nud[e3]|exploit)/i,
];

// Tier 2 — soft warn: common profanity. User may still send after confirmation.
const PROFANITY: RegExp[] = [
  /\bf+u+c+k+s?\b/i,
  /\bs+h+i+t+s?\b/i,
  /\ba+s+s+h+o+l+e+s?\b/i,
  /\bb+i+t+c+h+e?s?\b/i,
  /\bc+u+n+t+s?\b/i,
  /\bb+a+s+t+a+r+d+s?\b/i,
  /\bd+i+c+k+s?\b/i,
  /\bc+o+c+k+s?\b/i,
  /\bp+u+s+s+y\b/i,
  /\bw+h+o+r+e+s?\b/i,
  /\bs+l+u+t+s?\b/i,
  /\bd+a+m+n\b/i,
  /\bcrap\b/i,
];

export type FilterResult =
  | { ok: true }
  | { ok: false; reason: string }
  | { ok: 'warn'; reason: string };

/**
 * Returns:
 * - `{ ok: true }` — message is clean
 * - `{ ok: false, reason }` — hard block (slurs, threats, illegal content)
 * - `{ ok: 'warn', reason }` — soft warning (common profanity); user may confirm and send
 */
export function filterContent(text: string): FilterResult {
  for (const pattern of OBJECTIONABLE) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason:
          "Your message contains content that violates HomeWithin's community guidelines and cannot be sent.",
      };
    }
  }
  for (const pattern of PROFANITY) {
    if (pattern.test(text)) {
      return {
        ok: 'warn',
        reason:
          'Your message contains strong language. HomeWithin is a safe space — please keep the conversation respectful.',
      };
    }
  }
  return { ok: true };
}

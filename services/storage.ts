import type { CheckIn, DisguiseStyle, JournalEntry } from "@/types";
import * as Crypto from "expo-crypto";
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as SecureStore from "expo-secure-store";

const ONBOARDING_KEY = "hw_onboarding_complete";
const SESSION_KEY = "hw_session";
const SAFETY_PLAN_KEY = "hw_safety_plan";
const PIN_KEY = "hw_pin";
const DISGUISE_ENABLED_KEY = "hw_disguise_enabled";
const DISGUISE_STYLE_KEY = "hw_disguise_style";
const AI_CONSENT_KEY = "hw_ai_consent";
const CIRCLE_AI_CONSENT_KEY = "hw_circle_ai_consent";
const CIRCLE_AI_CONSENT_VERSION = "2026-06-05";

export type { DisguiseStyle };

// Check-ins: one entry per day, keyed by date
const CHECKIN_DATES_KEY = "hw_checkin_dates";
const checkinKey = (date: string) => `hw_checkin_${date}`;

// Journal entries: keyed by UUID
const JOURNAL_IDS_KEY = "hw_journal_ids";
const journalKey = (id: string) => `hw_journal_${id}`;

export async function markOnboardingComplete() {
  await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return value === "true";
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY),
    SecureStore.deleteItemAsync(ONBOARDING_KEY),
  ]).catch(() => {});
}

export async function saveSession(data: object) {
  // Strip large fields before storing — SecureStore has a 2 KB limit.
  // needs/intentions/avatarUrl are re-fetched from Supabase on the next authenticated launch.
  const {
    needs: _n,
    intentions: _i,
    avatarUrl: _a,
    ...slim
  } = data as Record<string, unknown>;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(slim));
}

export async function getSession(): Promise<object | null> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;
  const parsed = JSON.parse(value);
  // Restore stripped arrays so callers always get a valid UserProfile shape.
  return { needs: [], intentions: [], ...parsed };
}

export async function saveSafetyPlan(steps: string[]) {
  await SecureStore.setItemAsync(SAFETY_PLAN_KEY, JSON.stringify(steps));
}

export async function getSafetyPlan(): Promise<string[]> {
  const value = await SecureStore.getItemAsync(SAFETY_PLAN_KEY);
  return value ? JSON.parse(value) : [];
}

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_DK_LEN = 32;
const PBKDF2_TAG = "pbkdf2v1:";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

export async function setPin(pin: string) {
  const saltBytes = await Crypto.getRandomBytesAsync(16);
  const hashBytes = pbkdf2(sha256, pin, saltBytes, {
    c: PBKDF2_ITERATIONS,
    dkLen: PBKDF2_DK_LEN,
  });
  await SecureStore.setItemAsync(
    PIN_KEY,
    `${PBKDF2_TAG}${toHex(saltBytes)}:${toHex(hashBytes)}`,
  );
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;

  if (stored.startsWith(PBKDF2_TAG)) {
    const parts = stored.slice(PBKDF2_TAG.length).split(":");
    if (parts.length !== 2) return false;
    const saltBytes = fromHex(parts[0]);
    const storedHash = fromHex(parts[1]);
    const derived = pbkdf2(sha256, pin, saltBytes, {
      c: PBKDF2_ITERATIONS,
      dkLen: PBKDF2_DK_LEN,
    });
    // Constant-time comparison to prevent timing attacks
    if (derived.length !== storedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ storedHash[i];
    return diff === 0;
  }

  // Legacy: plain SHA-256 (no salt). Verify and migrate to PBKDF2 in place.
  const legacy = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin,
  );
  if (stored !== legacy) return false;
  await setPin(pin);
  return true;
}

export async function hasPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return !!stored;
}

export async function deletePin() {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

// ─── Disguise mode ──────────────────────────────────────────────────────────

export async function getDisguiseEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(DISGUISE_ENABLED_KEY);
  return value === "true";
}

export async function setDisguiseEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(
    DISGUISE_ENABLED_KEY,
    enabled ? "true" : "false",
  );
}

export async function getDisguiseStyle(): Promise<DisguiseStyle> {
  const value = await SecureStore.getItemAsync(DISGUISE_STYLE_KEY);
  if (value === "calculator" || value === "notes" || value === "weather")
    return value;
  return "weather";
}

export async function setDisguiseStyle(style: DisguiseStyle) {
  await SecureStore.setItemAsync(DISGUISE_STYLE_KEY, style);
}

export async function deleteSensitiveData() {
  const [journalIds, checkinDates] = await Promise.all([
    getJournalIds(),
    getCheckinDates(),
  ]);
  await Promise.all([
    // Session & onboarding
    SecureStore.deleteItemAsync(SESSION_KEY),
    SecureStore.deleteItemAsync(ONBOARDING_KEY),
    // Wellness data
    SecureStore.deleteItemAsync(SAFETY_PLAN_KEY),
    SecureStore.deleteItemAsync(JOURNAL_IDS_KEY),
    SecureStore.deleteItemAsync(CHECKIN_DATES_KEY),
    // Consent flags
    SecureStore.deleteItemAsync(AI_CONSENT_KEY),
    SecureStore.deleteItemAsync(CIRCLE_AI_CONSENT_KEY),
    // AI companion
    SecureStore.deleteItemAsync('hw_ai_history'),
    SecureStore.deleteItemAsync('hw_ai_timestamps'),
    SecureStore.deleteItemAsync('hw_ai_session_id'),
    SecureStore.deleteItemAsync('hw_ai_session_new'),
    // Social
    SecureStore.deleteItemAsync('hw_chosen_family'),
    SecureStore.deleteItemAsync('hw_last_read'),
    // Resources & security
    SecureStore.deleteItemAsync('hw_bookmarks'),
    SecureStore.deleteItemAsync(PIN_KEY),
    SecureStore.deleteItemAsync(DISGUISE_ENABLED_KEY),
    SecureStore.deleteItemAsync(DISGUISE_STYLE_KEY),
    // Per-entry data
    ...journalIds.map((id) => SecureStore.deleteItemAsync(journalKey(id))),
    ...checkinDates.map((date) => SecureStore.deleteItemAsync(checkinKey(date))),
  ]);
}

export async function hasAIConsent(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(AI_CONSENT_KEY);
  return value === "true";
}

export async function grantAIConsent(): Promise<void> {
  await SecureStore.setItemAsync(AI_CONSENT_KEY, "true");
}

export async function hasCircleAIConsent(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(CIRCLE_AI_CONSENT_KEY);
  if (!value) return false;

  try {
    const parsed = JSON.parse(value) as { version?: string };
    return parsed.version === CIRCLE_AI_CONSENT_VERSION;
  } catch {
    return false;
  }
}

export async function grantCircleAIConsent(): Promise<void> {
  await SecureStore.setItemAsync(
    CIRCLE_AI_CONSENT_KEY,
    JSON.stringify({
      version: CIRCLE_AI_CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
    }),
  );
}

// ─── Check-ins ────────────────────────────────────────────────

async function getCheckinDates(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(CHECKIN_DATES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveCheckIn(entry: CheckIn): Promise<void> {
  const dates = await getCheckinDates();
  if (!dates.includes(entry.date)) {
    await SecureStore.setItemAsync(
      CHECKIN_DATES_KEY,
      JSON.stringify([entry.date, ...dates]),
    );
  }
  await SecureStore.setItemAsync(checkinKey(entry.date), JSON.stringify(entry));
}

export async function getCheckIns(): Promise<CheckIn[]> {
  const dates = await getCheckinDates();
  const entries = await Promise.all(
    dates.map(async (date) => {
      const raw = await SecureStore.getItemAsync(checkinKey(date));
      return raw ? (JSON.parse(raw) as CheckIn) : null;
    }),
  );
  return entries.filter(Boolean) as CheckIn[];
}

export async function getTodayCheckIn(): Promise<CheckIn | null> {
  const today = new Date().toISOString().split("T")[0];
  const raw = await SecureStore.getItemAsync(checkinKey(today));
  return raw ? JSON.parse(raw) : null;
}

export async function getRecentCheckIns(days: number): Promise<CheckIn[]> {
  const all = await getCheckIns();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return all
    .filter((c) => new Date(c.date) >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Journal entries ──────────────────────────────────────────

async function getJournalIds(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(JOURNAL_IDS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const ids = await getJournalIds();
  if (!ids.includes(entry.id)) {
    await SecureStore.setItemAsync(
      JOURNAL_IDS_KEY,
      JSON.stringify([entry.id, ...ids]),
    );
  }
  await SecureStore.setItemAsync(journalKey(entry.id), JSON.stringify(entry));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const ids = await getJournalIds();
  const entries = await Promise.all(
    ids.map(async (id) => {
      const raw = await SecureStore.getItemAsync(journalKey(id));
      return raw ? (JSON.parse(raw) as JournalEntry) : null;
    }),
  );
  return (entries.filter(Boolean) as JournalEntry[]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const ids = await getJournalIds();
  await SecureStore.setItemAsync(
    JOURNAL_IDS_KEY,
    JSON.stringify(ids.filter((i) => i !== id)),
  );
  await SecureStore.deleteItemAsync(journalKey(id));
}

export async function exportJournalAsText(): Promise<string> {
  const entries = await getJournalEntries();
  if (entries.length === 0) return "No journal entries yet.";
  return entries
    .map((e) => {
      const tags = e.emotionTags.length
        ? `[${e.emotionTags.join(", ")}]\n`
        : "";
      return `── ${e.date} ──\n${tags}${e.body}`;
    })
    .join("\n\n");
}

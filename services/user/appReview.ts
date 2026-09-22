import * as SecureStore from 'expo-secure-store';
import * as StoreReview from 'expo-store-review';
import type { SafetyLevel } from '@/types';

const STATE_KEY = 'hw_review_prompt_state';
const COOLDOWN_DAYS = 90;
const MAX_PROMPTS = 3;

interface ReviewPromptState {
  count: number;
  lastPromptedAt: string | null;
}

async function getState(): Promise<ReviewPromptState> {
  const raw = await SecureStore.getItemAsync(STATE_KEY);
  return raw ? JSON.parse(raw) : { count: 0, lastPromptedAt: null };
}

async function saveState(state: ReviewPromptState): Promise<void> {
  await SecureStore.setItemAsync(STATE_KEY, JSON.stringify(state));
}

/**
 * Asks the OS to show the native app-rating prompt, but only at a genuinely
 * positive moment and only when it's safe to interrupt the user.
 *
 * Gating, deliberately conservative for a crisis-support app:
 * - Never when safetyLevel is 'yellow' or 'red' — someone who just told us
 *   they're struggling should not be asked to rate the app.
 * - At most once every 90 days, and at most 3 times ever (the OS already
 *   throttles this on its own, this is a second, app-level backstop).
 * - Silently does nothing if the platform can't show a native prompt
 *   (e.g. Expo Go, web) — callers never need to check availability first.
 */
export async function maybePromptReview(safetyLevel: SafetyLevel): Promise<void> {
  if (safetyLevel === 'yellow' || safetyLevel === 'red') return;

  const available = await StoreReview.isAvailableAsync().catch(() => false);
  if (!available) return;

  const state = await getState();
  if (state.count >= MAX_PROMPTS) return;

  if (state.lastPromptedAt) {
    const daysSince = (Date.now() - new Date(state.lastPromptedAt).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince < COOLDOWN_DAYS) return;
  }

  await StoreReview.requestReview();
  await saveState({ count: state.count + 1, lastPromptedAt: new Date().toISOString() });
}

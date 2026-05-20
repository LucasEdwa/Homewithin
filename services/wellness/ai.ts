import * as SecureStore from 'expo-secure-store';
import type { AIMessage } from '@/types';

const HISTORY_KEY = 'hw_ai_history';
const RATE_KEY = 'hw_ai_timestamps';
const SESSION_ID_KEY = 'hw_ai_session_id';
const SESSION_NEW_KEY = 'hw_ai_session_new'; // 'true' until first message sent
const MAX_PER_DAY = 20;
const MAX_HISTORY = 20;

// AI endpoint — put EXPO_PUBLIC_AI_API_KEY=haven_ZGLIl6ClRzbu1SK614zC in .env
const AI_ENDPOINT = 'https://app.second-horizon.com/chat';

export const AI_DISCLAIMER =
  'AI is not a therapist or crisis counselor. If you are in danger, use the emergency button.';

const SYSTEM_PROMPT = `You are a warm, grounding presence for LGBTQ+ people healing from family rejection, internalized shame, religious trauma, and related experiences.

Your role:
- Listen with deep empathy and no judgment
- Reflect back what the user shares with warmth and care
- Offer gentle grounding exercises when the user seems distressed (box breathing, 5-4-3-2-1 senses, body scan)
- Suggest relevant self-help approaches or articles when helpful
- Ask gentle questions that help the user explore their feelings

What you are NOT:
- A therapist, counselor, or mental health professional
- A source of medical or psychiatric advice
- A crisis responder (always refer to a hotline for crisis situations)

If the user mentions suicide, self-harm, or immediate danger, always say:
"I hear that you're in a really hard place right now. Please reach out to the Trevor Project at 1-866-488-7386 or text HOME to 741741. I'm here with you, and I want you to be safe."

Tone: warm, grounding, direct, never clinical. Keep responses under 200 words. Ask one question at a time.`;

// ─── Rate limiting (client-side) ─────────────────────────────────────────────

async function getRateTimestamps(): Promise<number[]> {
  const raw = await SecureStore.getItemAsync(RATE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function checkRateLimit(): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const timestamps = (await getRateTimestamps()).filter((t) => t > oneDayAgo);
  const remaining = Math.max(0, MAX_PER_DAY - timestamps.length);
  return { allowed: remaining > 0, remaining };
}

async function recordUsage(): Promise<void> {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const timestamps = (await getRateTimestamps()).filter((t) => t > oneDayAgo);
  await SecureStore.setItemAsync(RATE_KEY, JSON.stringify([...timestamps, now]));
}

// ─── Conversation history ─────────────────────────────────────────────────────

export async function getHistory(): Promise<AIMessage[]> {
  const raw = await SecureStore.getItemAsync(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearHistory(): Promise<void> {
  await SecureStore.deleteItemAsync(HISTORY_KEY);
  await SecureStore.deleteItemAsync(SESSION_ID_KEY);
  await SecureStore.deleteItemAsync(SESSION_NEW_KEY);
}

async function appendHistory(message: AIMessage): Promise<void> {
  const history = await getHistory();
  const updated = [...history, message].slice(-MAX_HISTORY);
  await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify(updated));
}

// ─── AI call ─────────────────────────────────────────────────────────────────

export interface UserContext {
  nickname?: string;
  country?: string;
  needs?: string[];
  safetyLevel?: 'green' | 'yellow' | 'red' | null;

  // Mood
  recentMoodAvg?: number;       // avg of last 7 check-ins (1–5)
  moodTrend?: 'improving' | 'declining' | 'stable' | null;
  currentMoodScore?: number;    // from today's check-in or nav param

  // Journal
  journalStreak?: number;
  recentEmotionTags?: string[]; // most frequent tags from last 5 entries
  journalPreview?: string;      // snippet from the entry that triggered opening

  // Programs
  programProgress?: Array<{ title: string; completed: number; total: number }>;

  // Connections
  connectionsCount?: number;
  chosenFamilyCount?: number;

  // Full history for pattern matching
  journalSummaries?: Array<{ date: string; tags: string[]; snippet: string }>;
  moodHistory?: Array<{ date: string; score: number }>;
}

/** Builds the full personalized system prompt from live user data. */
export function buildSystemPrompt(ctx: UserContext): string {
  const MOOD_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];

  const profileBlock = [
    ctx.nickname ? `Name (anonymous): ${ctx.nickname}` : null,
    ctx.country ? `Country: ${ctx.country}` : null,
    ctx.needs?.length ? `Working through: ${ctx.needs.map((n) => n.replace(/_/g, ' ')).join(', ')}` : null,
  ].filter(Boolean).join('\n');

  const safetyLabel = ctx.safetyLevel === 'green'
    ? 'safe (green) — they seem stable'
    : ctx.safetyLevel === 'yellow'
    ? 'some risk (yellow) — offer gentle check-ins on safety'
    : ctx.safetyLevel === 'red'
    ? 'high risk (red) — prioritise safety, offer hotline, do not ignore'
    : 'unknown';

  const moodLabel = ctx.recentMoodAvg != null
    ? `avg ${ctx.recentMoodAvg.toFixed(1)}/5 over last 7 check-ins — ${ctx.moodTrend ?? 'no trend data'}`
    : 'no mood data yet';

  const currentMood = ctx.currentMoodScore
    ? `Today's mood: ${MOOD_LABELS[ctx.currentMoodScore] ?? ctx.currentMoodScore}/5`
    : null;

  const journalBlock = [
    ctx.journalStreak != null ? `Journal streak: ${ctx.journalStreak} day${ctx.journalStreak !== 1 ? 's' : ''}` : null,
    ctx.recentEmotionTags?.length
      ? `Recurring emotion tags: ${ctx.recentEmotionTags.slice(0, 5).join(', ')}`
      : null,
    ctx.journalPreview
      ? `From their latest journal entry: "${ctx.journalPreview.slice(0, 200)}…"`
      : null,
  ].filter(Boolean).join('\n');

  const programBlock = ctx.programProgress?.length
    ? ctx.programProgress
        .filter((p) => p.completed > 0)
        .map((p) => `• ${p.title}: ${p.completed}/${p.total} lessons`)
        .join('\n') || 'No programs started yet'
    : 'No healing programs started yet';

  const connectionBlock = [
    ctx.connectionsCount != null ? `Peer connections: ${ctx.connectionsCount}` : null,
    ctx.chosenFamilyCount != null ? `Chosen family members mapped: ${ctx.chosenFamilyCount}` : null,
  ].filter(Boolean).join('\n');

  const journalTimeline = ctx.journalSummaries?.length
    ? ctx.journalSummaries
        .slice(0, 20)
        .map((j) => `[${j.date}] tags: ${j.tags.join(', ') || 'none'} — "${j.snippet}"`)
        .join('\n')
    : null;

  const moodHistoryBlock = ctx.moodHistory?.length
    ? ctx.moodHistory
        .slice(0, 30)
        .map((m) => `${m.date}: ${MOOD_LABELS[m.score] ?? m.score}`)
        .join(', ')
    : null;

  return `${SYSTEM_PROMPT}

─── USER CONTEXT ───────────────────────────────
${profileBlock || 'Anonymous user'}

Safety level: ${safetyLabel}
Mood: ${moodLabel}
${currentMood ?? ''}

${journalBlock || 'No journal history yet'}

Healing programs in progress:
${programBlock}

${connectionBlock || 'No connections yet'}
────────────────────────────────────────────────
${journalTimeline ? `\n─── JOURNAL HISTORY (newest first) ────────────\n${journalTimeline}\n────────────────────────────────────────────────` : ''}
${moodHistoryBlock ? `\n─── MOOD HISTORY ───────────────────────────────\n${moodHistoryBlock}\n────────────────────────────────────────────────` : ''}

Use this context to respond in a personalized way. You do not need to state back all these facts — just let them inform your empathy and suggestions.

IMPORTANT — Pattern matching: When the user's message echoes a theme, feeling, or situation that appears in their journal history or mood pattern, gently acknowledge that connection if it feels natural. For example: "It sounds like this has been weighing on you for a while" or "I notice this theme of [X] has come up for you before." Never recite journal content back verbatim — use it only to deepen your empathy and understanding. If safety is yellow or red, weave in gentle safety check-ins. If they have recurring shame or fear tags, approach those topics with extra care. If they are early in healing programs, encourage progress. If they have no connections yet, gently acknowledge loneliness without pressure.`;
}

// ── Legacy AIContext for backward compatibility with nav params ────────────────
export interface AIContext {
  moodScore?: number;
  journalPreview?: string;
  userContext?: UserContext;
}

export async function sendAIMessage(
  userText: string,
  context?: AIContext
): Promise<{ message: AIMessage | null; error?: string }> {
  const { allowed } = await checkRateLimit();
  if (!allowed) {
    return { message: null, error: `Daily limit reached (${MAX_PER_DAY} messages/day). Come back tomorrow.` };
  }

  const userMessage: AIMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    body: userText,
    createdAt: new Date().toISOString(),
  };
  await appendHistory(userMessage);

  // Build system prompt — use rich UserContext if available, fall back to basic
  let systemContent: string;
  if (context?.userContext) {
    // Merge nav params into the rich context
    const richCtx: UserContext = {
      ...context.userContext,
      currentMoodScore: context.moodScore ?? context.userContext.currentMoodScore,
      journalPreview: context.journalPreview ?? context.userContext.journalPreview,
    };
    systemContent = buildSystemPrompt(richCtx);
  } else {
    // Fallback: basic context note (old behaviour)
    let contextNote = '';
    if (context?.moodScore) {
      const labels = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];
      contextNote += `[User's current mood: ${labels[context.moodScore] ?? context.moodScore}/5] `;
    }
    if (context?.journalPreview) {
      contextNote += `[From their recent journal: "${context.journalPreview.slice(0, 150)}…"] `;
    }
    systemContent = SYSTEM_PROMPT + (contextNote ? `\n\nContext: ${contextNote}` : '');
  }

  // ── Session ID (server tracks conversation history via this ID) ──────────────
  let sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `hw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await SecureStore.setItemAsync(SESSION_ID_KEY, sessionId);
    // Mark as a fresh session so we inject context on the first real message
    await SecureStore.setItemAsync(SESSION_NEW_KEY, 'true');
  }

  // On a brand-new session, prepend the system context to the first user message.
  // The server sees this as background info; the UI only shows the bare user text.
  const isNewSession = (await SecureStore.getItemAsync(SESSION_NEW_KEY)) === 'true';
  const messageToSend = isNewSession
    ? `${systemContent}\n\n---\n\n${userText}`
    : userText;

  if (isNewSession) {
    await SecureStore.setItemAsync(SESSION_NEW_KEY, 'false');
  }

  const AI_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY ?? '';
  if (!AI_API_KEY) {
    return { message: null, error: 'AI companion not configured. Add EXPO_PUBLIC_AI_API_KEY to .env.' };
  }

  try {
    let responseText: string;

    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId, message: messageToSend }),
    });

    if (!res.ok) throw new Error(`AI endpoint error ${res.status}`);
    const json = await res.json();
    responseText = json.reply ?? "I'm here with you. Could you say that again?";

    await recordUsage();

    const assistantMessage: AIMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      body: responseText,
      createdAt: new Date().toISOString(),
    };
    await appendHistory(assistantMessage);

    return { message: assistantMessage };
  } catch (err: any) {
    console.error('AI call failed:', err?.message);
    return { message: null, error: 'Something went wrong. Try again in a moment.' };
  }
}

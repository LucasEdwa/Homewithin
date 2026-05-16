import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import type { AIMessage } from '@/types';

const HISTORY_KEY = 'hw_ai_history';
const RATE_KEY = 'hw_ai_timestamps';
const MAX_PER_DAY = 20;
const MAX_HISTORY = 20; // messages kept in context

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
}

async function appendHistory(message: AIMessage): Promise<void> {
  const history = await getHistory();
  const updated = [...history, message].slice(-MAX_HISTORY);
  await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify(updated));
}

// ─── AI call ─────────────────────────────────────────────────────────────────

export interface AIContext {
  moodScore?: number;
  recentMood?: string;
  journalPreview?: string;
}

export async function sendAIMessage(
  userText: string,
  context?: AIContext
): Promise<{ message: AIMessage | null; error?: string }> {
  const { allowed, remaining } = await checkRateLimit();
  if (!allowed) {
    return { message: null, error: `Daily limit reached (${MAX_PER_DAY} messages/day). Come back tomorrow.` };
  }

  const history = await getHistory();

  const userMessage: AIMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    body: userText,
    createdAt: new Date().toISOString(),
  };
  await appendHistory(userMessage);

  // Build context prefix if provided
  let contextNote = '';
  if (context?.moodScore) {
    const labels = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];
    contextNote += `[User's current mood: ${labels[context.moodScore] ?? context.moodScore}/5] `;
  }
  if (context?.journalPreview) {
    contextNote += `[From their recent journal: "${context.journalPreview.slice(0, 150)}…"] `;
  }

  const openaiMessages = [
    { role: 'system', content: SYSTEM_PROMPT + (contextNote ? `\n\nContext: ${contextNote}` : '') },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.body })),
    { role: 'user', content: userText },
  ];

  try {
    let responseText: string;

    if (supabase) {
      // Call via Supabase Edge Function (server-side key, safe)
      const { data, error } = await supabase.functions.invoke('ai-companion', {
        body: { messages: openaiMessages },
      });
      if (error) throw new Error(error.message);
      responseText = data?.reply ?? 'Sorry, I couldn\'t respond right now.';
    } else {
      // Direct fallback for local dev (requires EXPO_PUBLIC_OPENAI_API_KEY — insecure in production)
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        return { message: null, error: 'AI companion not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to .env.' };
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: openaiMessages, max_tokens: 300, temperature: 0.75 }),
      });
      if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
      const json = await res.json();
      responseText = json.choices?.[0]?.message?.content ?? 'No response.';
    }

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

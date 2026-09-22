import * as SecureStore from "expo-secure-store";

import {
    AI_DISCLAIMER,
    checkRateLimit,
    clearHistory,
    getHistory,
    getWelcomeBack,
    sendAIMessage,
} from "@/services/wellness/ai";

jest.mock("expo-secure-store");

const mockFunctionsInvoke = jest.fn();
jest.mock("@/services/supabase", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
  isSupabaseConfigured: true,
  currentUserId: jest.fn().mockResolvedValue(null),
}));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;

const store: Record<string, string> = {};
beforeEach(() => {
  jest.restoreAllMocks();
  mockFunctionsInvoke.mockReset();
  Object.keys(store).forEach((k) => delete store[k]);
  mockStore.getItemAsync.mockImplementation(async (key) => store[key] ?? null);
  mockStore.setItemAsync.mockImplementation(async (key, value) => {
    store[key] = value;
  });
  mockStore.deleteItemAsync.mockImplementation(async (key) => {
    delete store[key];
  });
});

describe("AI_DISCLAIMER", () => {
  it("is a non-empty string", () => {
    expect(typeof AI_DISCLAIMER).toBe("string");
    expect(AI_DISCLAIMER.length).toBeGreaterThan(0);
  });
});

describe("checkRateLimit", () => {
  it("allows when no usage recorded", async () => {
    const { allowed, remaining } = await checkRateLimit();
    expect(allowed).toBe(true);
    expect(remaining).toBe(20);
  });

  it("remaining decreases after filling timestamps", async () => {
    const now = Date.now();
    const timestamps = Array.from({ length: 15 }, (_, i) => now - i * 1000);
    store["hw_ai_timestamps"] = JSON.stringify(timestamps);
    const { allowed, remaining } = await checkRateLimit();
    expect(allowed).toBe(true);
    expect(remaining).toBe(5);
  });

  it("blocks when 20 messages used", async () => {
    const now = Date.now();
    const timestamps = Array.from({ length: 20 }, (_, i) => now - i * 1000);
    store["hw_ai_timestamps"] = JSON.stringify(timestamps);
    const { allowed, remaining } = await checkRateLimit();
    expect(allowed).toBe(false);
    expect(remaining).toBe(0);
  });

  it("ignores timestamps older than 24 hours", async () => {
    const old = Date.now() - 25 * 60 * 60 * 1000;
    const timestamps = Array.from({ length: 20 }, () => old);
    store["hw_ai_timestamps"] = JSON.stringify(timestamps);
    const { allowed, remaining } = await checkRateLimit();
    expect(allowed).toBe(true);
    expect(remaining).toBe(20);
  });
});

describe("getHistory / clearHistory", () => {
  it("returns empty array when no history", async () => {
    const history = await getHistory();
    expect(history).toEqual([]);
  });

  it("clearHistory removes stored messages", async () => {
    store["hw_ai_history"] = JSON.stringify([
      {
        id: "1",
        role: "user",
        body: "hi",
        createdAt: new Date().toISOString(),
      },
    ]);
    await clearHistory();
    const history = await getHistory();
    expect(history).toEqual([]);
  });
});

describe("sendAIMessage", () => {
  it("returns rate limit error when limit exceeded", async () => {
    const now = Date.now();
    const timestamps = Array.from({ length: 20 }, (_, i) => now - i * 1000);
    store["hw_ai_timestamps"] = JSON.stringify(timestamps);

    const { message, error } = await sendAIMessage("Hello");
    expect(message).toBeNull();
    expect(error).toMatch(/daily limit/i);
  });

  it("appends user message to history before API call", async () => {
    mockFunctionsInvoke.mockRejectedValue(new Error("Network error"));

    await sendAIMessage("Test message");
    const history = await getHistory();
    expect(
      history.some((m) => m.role === "user" && m.body === "Test message"),
    ).toBe(true);
  });

  it("stores assistant reply in history on success", async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { reply: "I hear you." },
      error: null,
    });

    const { message, error } = await sendAIMessage("Hello there");
    expect(error).toBeUndefined();
    expect(message?.body).toBe("I hear you.");
    expect(message?.role).toBe("assistant");

    const history = await getHistory();
    expect(
      history.some((m) => m.role === "assistant" && m.body === "I hear you."),
    ).toBe(true);
  });

  it("returns error string when invoke throws", async () => {
    mockFunctionsInvoke.mockRejectedValue(new Error("Network error"));

    const { message, error } = await sendAIMessage("Hello");
    expect(message).toBeNull();
    expect(error).toMatch(/something went wrong/i);
  });
});

describe("getWelcomeBack", () => {
  const NOW = new Date("2026-06-15T12:00:00Z");

  it("returns null when there is no prior message", () => {
    expect(getWelcomeBack(undefined, null, NOW)).toBeNull();
  });

  it("returns null when the gap is under the threshold", () => {
    const twoDaysAgo = new Date("2026-06-13T12:00:00Z").toISOString();
    expect(getWelcomeBack(twoDaysAgo, null, NOW)).toBeNull();
  });

  it("returns a generic note at the threshold with no mood trend", () => {
    const threeDaysAgo = new Date("2026-06-12T12:00:00Z").toISOString();
    expect(getWelcomeBack(threeDaysAgo, null, NOW)).toEqual({ days: 3, variant: "generic" });
  });

  it("picks the moodDeclining variant when the trend is declining", () => {
    const fiveDaysAgo = new Date("2026-06-10T12:00:00Z").toISOString();
    expect(getWelcomeBack(fiveDaysAgo, "declining", NOW)).toEqual({ days: 5, variant: "moodDeclining" });
  });

  it("picks the moodImproving variant when the trend is improving", () => {
    const fiveDaysAgo = new Date("2026-06-10T12:00:00Z").toISOString();
    expect(getWelcomeBack(fiveDaysAgo, "improving", NOW)).toEqual({ days: 5, variant: "moodImproving" });
  });

  it("falls back to generic for a stable trend", () => {
    const fiveDaysAgo = new Date("2026-06-10T12:00:00Z").toISOString();
    expect(getWelcomeBack(fiveDaysAgo, "stable", NOW)).toEqual({ days: 5, variant: "generic" });
  });
});

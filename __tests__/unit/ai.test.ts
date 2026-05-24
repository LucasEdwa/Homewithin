import * as SecureStore from "expo-secure-store";

import {
    AI_DISCLAIMER,
    checkRateLimit,
    clearHistory,
    getHistory,
    sendAIMessage,
} from "@/services/wellness/ai";

jest.mock("expo-secure-store");
jest.mock("@/services/supabase", () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;

const store: Record<string, string> = {};
beforeEach(() => {
  jest.restoreAllMocks();
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

  it("returns config error when no API key", async () => {
    const origEnv = process.env.EXPO_PUBLIC_AI_API_KEY;
    delete process.env.EXPO_PUBLIC_AI_API_KEY;

    const { message, error } = await sendAIMessage("Hello");
    expect(message).toBeNull();
    expect(error).toMatch(/not configured/i);

    process.env.EXPO_PUBLIC_AI_API_KEY = origEnv;
  });

  it("appends user message to history before API call", async () => {
    const origEnv = process.env.EXPO_PUBLIC_AI_API_KEY;
    delete process.env.EXPO_PUBLIC_AI_API_KEY;

    await sendAIMessage("Test message");
    const history = await getHistory();
    expect(
      history.some((m) => m.role === "user" && m.body === "Test message"),
    ).toBe(true);

    process.env.EXPO_PUBLIC_AI_API_KEY = origEnv;
  });

  it("with mocked fetch: stores assistant reply in history", async () => {
    process.env.EXPO_PUBLIC_AI_API_KEY = "test-fake-key";
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "I hear you." }),
    }) as unknown as typeof fetch;

    const { message, error } = await sendAIMessage("Hello there");
    expect(error).toBeUndefined();
    expect(message?.body).toBe("I hear you.");
    expect(message?.role).toBe("assistant");

    const history = await getHistory();
    expect(
      history.some((m) => m.role === "assistant" && m.body === "I hear you."),
    ).toBe(true);

    delete process.env.EXPO_PUBLIC_AI_API_KEY;
    jest.restoreAllMocks();
  });

  it("returns error string when fetch throws", async () => {
    process.env.EXPO_PUBLIC_AI_API_KEY = "test-fake-key";
    (globalThis as any).fetch = jest
      .fn()
      .mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

    const { message, error } = await sendAIMessage("Hello");
    expect(message).toBeNull();
    expect(error).toMatch(/something went wrong/i);

    delete process.env.EXPO_PUBLIC_AI_API_KEY;
    jest.restoreAllMocks();
  });
});

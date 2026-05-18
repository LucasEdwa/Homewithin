// Unit tests for services/circles.ts
// Supabase is mocked via a configurable getter so individual describe blocks
// can switch it between null (offline) and a live-ish stub.

// ─── Configurable mock state ──────────────────────────────────────────────────

interface MockConfig {
  enabled: boolean;
  authUser: { id: string } | null;
  fromResult: { error: { message: string; code: string } | null };
}

const mockCfg: MockConfig = {
  enabled: false,
  authUser: null,
  fromResult: { error: null },
};

const supabaseStub = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: mockCfg.authUser } }),
  },
  from: () => ({
    insert: () => Promise.resolve(mockCfg.fromResult),
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
        single: () =>
          Promise.resolve({ data: null, error: { message: "not found" } }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
    delete: () => ({
      eq: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    update: () => ({
      eq: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  }),
};

jest.mock("@/services/supabase", () => ({
  get supabase() {
    return mockCfg.enabled ? supabaseStub : null;
  },
  isSupabaseConfigured: true,
  async currentUserId() {
    if (!mockCfg.enabled || !mockCfg.authUser) return null;
    return mockCfg.authUser.id;
  },
}));

import {
    getCircle,
    getCircleMessages,
    joinCircle,
    leaveCircle,
    listCircles,
    markCircleIntroSeen,
    reportInCircle,
    sendCircleMessage,
    subscribeToCircleMessages,
} from "@/services/circles";

beforeEach(() => {
  // Default: offline (null supabase)
  mockCfg.enabled = false;
  mockCfg.authUser = null;
  mockCfg.fromResult = { error: null };
});

// ─── listCircles ──────────────────────────────────────────────────────────────

describe("listCircles", () => {
  it("returns empty array when supabase is null", async () => {
    const result = await listCircles();
    expect(result).toEqual([]);
  });
});

// ─── getCircle ────────────────────────────────────────────────────────────────

describe("getCircle", () => {
  it("returns null when supabase is null", async () => {
    const result = await getCircle("some-id");
    expect(result).toBeNull();
  });
});

// ─── joinCircle ───────────────────────────────────────────────────────────────

describe("joinCircle", () => {
  it('returns { ok: false, reason: "unknown" } when supabase is null', async () => {
    const result = await joinCircle("some-id");
    expect(result).toEqual({ ok: false, reason: "unknown" });
  });
});

// ─── leaveCircle ──────────────────────────────────────────────────────────────

describe("leaveCircle", () => {
  it("returns false when supabase is null", async () => {
    const result = await leaveCircle("some-id");
    expect(result).toBe(false);
  });
});

// ─── markCircleIntroSeen ──────────────────────────────────────────────────────

describe("markCircleIntroSeen", () => {
  it("resolves without error when supabase is null", async () => {
    await expect(markCircleIntroSeen("some-id")).resolves.toBeUndefined();
  });
});

// ─── getCircleMessages ────────────────────────────────────────────────────────

describe("getCircleMessages", () => {
  it("returns empty array when supabase is null", async () => {
    const result = await getCircleMessages("some-id");
    expect(result).toEqual([]);
  });
});

// ─── sendCircleMessage ────────────────────────────────────────────────────────

describe("sendCircleMessage", () => {
  it("returns null when supabase is null", async () => {
    const result = await sendCircleMessage("some-id", "hello");
    expect(result).toBeNull();
  });
});

// ─── subscribeToCircleMessages ────────────────────────────────────────────────

describe("subscribeToCircleMessages", () => {
  it("returns a no-op unsubscribe when supabase is null", () => {
    const unsub = subscribeToCircleMessages("some-id", jest.fn());
    expect(typeof unsub).toBe("function");
    expect(() => unsub()).not.toThrow();
  });
});

// ─── reportInCircle ───────────────────────────────────────────────────────────

describe("reportInCircle", () => {
  it("resolves without error when supabase is null", async () => {
    await expect(
      reportInCircle("circle-id", "harassment", {
        messageId: "msg-1",
        reportedUserId: "user-1",
      }),
    ).resolves.toBeUndefined();
  });

  it("resolves without error when called with reason only", async () => {
    await expect(reportInCircle("circle-id", "spam")).resolves.toBeUndefined();
  });
});

// ─── joinCircle error surface ─────────────────────────────────────────────────
// Enable the stub supabase to exercise the error-path branches.

describe("joinCircle (supabase live mock)", () => {
  beforeEach(() => {
    mockCfg.enabled = true;
    mockCfg.authUser = { id: "uid-1" };
    mockCfg.fromResult = { error: null };
  });

  it('surfaces "full" reason when DB trigger raises "Circle is full"', async () => {
    mockCfg.fromResult = {
      error: { message: "Circle is full", code: "P0001" },
    };
    const result = await joinCircle("circle-id");
    expect(result).toEqual({ ok: false, reason: "full" });
  });

  it('surfaces "auth" reason when no user session', async () => {
    mockCfg.authUser = null;
    const result = await joinCircle("circle-id");
    expect(result).toEqual({ ok: false, reason: "auth" });
  });

  it("treats unique-constraint error (already member) as success", async () => {
    mockCfg.fromResult = {
      error: { message: "duplicate key value", code: "23505" },
    };
    const result = await joinCircle("circle-id");
    expect(result).toEqual({ ok: true });
  });
});

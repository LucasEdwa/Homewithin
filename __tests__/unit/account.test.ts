import * as SecureStore from "expo-secure-store";

import { deleteAccount } from "@/services/user/account";
import { deleteSensitiveData } from "@/services/storage";

// Build a chainable supabase mock where .from(t).delete().eq(col, val)
// resolves to { error: null } and records the call.
const calls: { table: string; column: string; value: string }[] = [];

function makeQuery(table: string) {
  const obj: any = {
    delete: () => obj,
    eq: (column: string, value: string) => {
      calls.push({ table, column, value });
      return Promise.resolve({ error: null });
    },
  };
  return obj;
}

const mockGetUser = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn((t: string) => makeQuery(t));
const mockInvoke = jest.fn();

jest.mock("@/services/supabase", () => ({
  supabase: {
    auth: { getUser: () => mockGetUser(), signOut: () => mockSignOut() },
    from: (t: string) => mockFrom(t),
    functions: { invoke: (name: string, opts: any) => mockInvoke(name, opts) },
  },
}));

jest.mock("@/services/storage", () => ({
  deleteSensitiveData: jest.fn().mockResolvedValue(undefined),
}));

const setItem = SecureStore.setItemAsync as jest.Mock;
const deleteItem = SecureStore.deleteItemAsync as jest.Mock;

describe("deleteAccount", () => {
  beforeEach(() => {
    calls.length = 0;
    mockGetUser.mockReset();
    mockSignOut.mockReset().mockResolvedValue({ error: null });
    mockFrom.mockClear();
    mockInvoke.mockReset();
    (deleteSensitiveData as jest.Mock).mockClear().mockResolvedValue(undefined);
    deleteItem.mockClear();
  });

  it("deletes the auth row via the Edge Function on the happy path", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-0" } } });
    mockInvoke.mockResolvedValue({ data: { deleted: true }, error: null });

    const result = await deleteAccount();

    expect(mockInvoke).toHaveBeenCalledWith("delete-account", { body: {} });
    // No client-side per-table wipe should run when Edge Function succeeds.
    expect(calls).toHaveLength(0);
    expect(mockSignOut).toHaveBeenCalled();
    expect(result).toMatchObject({
      authRowDeleted: true,
      remoteCleared: true,
      signedOut: true,
      localCleared: true,
    });
    expect(result.errors).toEqual([]);
  });

  it("falls back to per-table wipe when the Edge Function errors", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "function not found" },
    });

    const result = await deleteAccount();

    // user_profiles, matches (x2 columns), messages, blocks, reports
    const tables = calls.map((c) => `${c.table}.${c.column}`);
    expect(tables).toEqual(
      expect.arrayContaining([
        "user_profiles.user_id",
        "matches.requester_id",
        "matches.target_id",
        "messages.sender_id",
        "blocks.blocker_id",
        "reports.reporter_id",
      ]),
    );
    calls.forEach((c) => expect(c.value).toBe("u-1"));

    expect(mockSignOut).toHaveBeenCalled();
    expect(deleteSensitiveData).toHaveBeenCalled();
    const wipedKeys = deleteItem.mock.calls.map((c) => c[0]);
    expect(wipedKeys).toEqual(
      expect.arrayContaining([
        "hw_onboarding_complete",
        "hw_pin",
        "hw_disguise_enabled",
        "hw_disguise_style",
        "hw_bookmarks",
      ]),
    );

    expect(result).toMatchObject({
      authRowDeleted: false,
      localCleared: true,
      remoteCleared: true,
      signedOut: true,
    });
  });

  it("still clears local data when not authenticated remotely", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await deleteAccount();

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
    expect(mockSignOut).toHaveBeenCalled();
    expect(deleteSensitiveData).toHaveBeenCalled();
    expect(result.localCleared).toBe(true);
    expect(result.remoteCleared).toBe(true);
    expect(result.signedOut).toBe(true);
  });

  it("reports errors but still finishes when fallback wipe fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-2" } } });
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "unavailable" },
    });
    mockFrom.mockImplementationOnce(() => {
      const obj: any = {
        delete: () => obj,
        eq: () => Promise.resolve({ error: { message: "denied" } }),
      };
      return obj;
    });

    const result = await deleteAccount();

    expect(result.remoteCleared).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(mockSignOut).toHaveBeenCalled();
    expect(result.localCleared).toBe(true);
    expect(result.signedOut).toBe(true);
  });
});

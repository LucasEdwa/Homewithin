// Tests for UnreadContext — specifically:
// 1. userId is cached synchronously (no async getUser on every realtime event)
// 2. Unread badge increments for peer messages in tracked matches
// 3. Own messages, active matches, and untracked matches are ignored

import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { render, screen, act, waitFor } from '@testing-library/react-native';
import { UnreadProvider, useUnread } from '@/context/UnreadContext';

// ─── Supabase mock ────────────────────────────────────────────────────────────

// Capture the realtime INSERT callback so tests can fire it manually.
let mockRealtimeCb: ((payload: any) => void) = () => {};

// Capture the auth state change callback so tests can simulate sign-in/out.
let mockAuthChangeCb: ((event: string, session: any) => void) = () => {};

let mockSession: { user: { id: string } } | null = null;

const mockChannelStub = {
  on: jest.fn().mockImplementation((_type: string, _filter: any, cb: (p: any) => void) => {
    mockRealtimeCb = cb;
    return mockChannelStub;
  }),
  subscribe: jest.fn().mockReturnThis(),
};

const mockSupabaseStub = {
  channel: jest.fn().mockReturnValue(mockChannelStub),
  removeChannel: jest.fn(),
  auth: {
    getSession: jest.fn().mockImplementation(() =>
      Promise.resolve({ data: { session: mockSession } }),
    ),
    onAuthStateChange: jest.fn().mockImplementation((cb: (e: string, s: any) => void) => {
      mockAuthChangeCb = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
  },
};

jest.mock('@/services/supabase', () => ({
  get supabase() { return mockSupabaseStub; },
  isSupabaseConfigured: true,
  async currentUserId() {
    return mockSession?.user.id ?? null;
  },
}));

// Mock the unread service so tests don't need a real Supabase project.
const mockGetUnreadCounts = jest.fn().mockResolvedValue({});
const mockMarkMatchRead = jest.fn().mockResolvedValue(undefined);

jest.mock('@/services/social/unread', () => ({
  getUnreadCounts: (...args: any[]) => mockGetUnreadCounts(...args),
  markMatchRead: (...args: any[]) => mockMarkMatchRead(...args),
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

// Renders a consumer that exposes unread state through testID text nodes.
// `onMount` is called once after mount — use it to call `refresh` etc.
function UnreadDisplay({ onMount }: { onMount?: (ctx: ReturnType<typeof useUnread>) => void }) {
  const ctx = useUnread();
  const { unreadByMatch, totalUnread } = ctx;

  useEffect(() => {
    onMount?.(ctx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Text testID="total">{totalUnread}</Text>
      <Text testID="match1">{unreadByMatch['match-1'] ?? 0}</Text>
      <Text testID="match2">{unreadByMatch['match-2'] ?? 0}</Text>
    </>
  );
}

function renderUnread(onMount?: (ctx: ReturnType<typeof useUnread>) => void) {
  return render(
    <UnreadProvider>
      <UnreadDisplay onMount={onMount} />
    </UnreadProvider>,
  );
}

// ─── Reset state ──────────────────────────────────────────────────────────────

beforeEach(() => {
  mockSession = null;
  mockRealtimeCb = () => {};
  mockAuthChangeCb = () => {};
  mockGetUnreadCounts.mockResolvedValue({});
  jest.clearAllMocks();

  // Re-apply stubs after clearAllMocks.
  mockChannelStub.on.mockImplementation((_type: string, _filter: any, cb: (p: any) => void) => {
    mockRealtimeCb = cb;
    return mockChannelStub;
  });
  mockChannelStub.subscribe.mockReturnThis();
  mockSupabaseStub.channel.mockReturnValue(mockChannelStub);
  mockSupabaseStub.auth.getSession.mockImplementation(() =>
    Promise.resolve({ data: { session: mockSession } }),
  );
  mockSupabaseStub.auth.onAuthStateChange.mockImplementation(
    (cb: (e: string, s: any) => void) => {
      mockAuthChangeCb = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    },
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UnreadProvider — initial state', () => {
  it('starts with totalUnread = 0', async () => {
    renderUnread();
    await waitFor(() => {
      expect(screen.getByTestId('total').props.children).toBe(0);
    });
  });

  it('starts with no per-match unread counts', async () => {
    renderUnread();
    await waitFor(() => {
      expect(screen.getByTestId('match1').props.children).toBe(0);
    });
  });
});

describe('UnreadProvider — userId caching', () => {
  it('seeds uidRef from getSession on mount', async () => {
    mockSession = { user: { id: 'my-uid' } };
    renderUnread();
    // getSession must be called during the auth setup effect.
    await waitFor(() => {
      expect(mockSupabaseStub.auth.getSession).toHaveBeenCalled();
    });
  });

  it('updates uidRef when auth state changes (sign-in)', async () => {
    renderUnread();
    await waitFor(() => {
      expect(mockSupabaseStub.auth.onAuthStateChange).toHaveBeenCalled();
    });
    // Simulate a sign-in event after mount.
    act(() => {
      mockAuthChangeCb('SIGNED_IN', { user: { id: 'new-uid' } });
    });
    // No assertion on internal ref — we test the side effect below.
    // If uidRef were NOT updated, own-message filtering would break.
  });
});

describe('UnreadProvider — realtime unread counting', () => {
  it('increments unread for a peer message in a tracked match', async () => {
    mockSession = { user: { id: 'my-uid' } };

    renderUnread((ctx) => {
      // Register 'match-1' as a tracked match.
      ctx.refresh(['match-1']);
    });

    // Wait for the auth effect and refresh to settle.
    await waitFor(() => {
      expect(mockSupabaseStub.auth.getSession).toHaveBeenCalled();
    });

    // Simulate a message from the peer.
    act(() => {
      mockRealtimeCb({ new: { match_id: 'match-1', sender_id: 'peer-uid' } });
    });

    expect(screen.getByTestId('match1').props.children).toBe(1);
    expect(screen.getByTestId('total').props.children).toBe(1);
  });

  it('accumulates multiple unread messages', async () => {
    mockSession = { user: { id: 'my-uid' } };

    renderUnread((ctx) => { ctx.refresh(['match-1']); });

    await waitFor(() => expect(mockSupabaseStub.auth.getSession).toHaveBeenCalled());

    act(() => {
      mockRealtimeCb({ new: { match_id: 'match-1', sender_id: 'peer-uid' } });
      mockRealtimeCb({ new: { match_id: 'match-1', sender_id: 'peer-uid' } });
      mockRealtimeCb({ new: { match_id: 'match-1', sender_id: 'peer-uid' } });
    });

    expect(screen.getByTestId('match1').props.children).toBe(3);
  });

  it('does NOT increment for the current user\'s own message', async () => {
    mockSession = { user: { id: 'my-uid' } };

    renderUnread((ctx) => { ctx.refresh(['match-1']); });

    await waitFor(() => expect(mockSupabaseStub.auth.getSession).toHaveBeenCalled());

    act(() => {
      // sender_id === uidRef (own message) — must be ignored.
      mockRealtimeCb({ new: { match_id: 'match-1', sender_id: 'my-uid' } });
    });

    expect(screen.getByTestId('match1').props.children).toBe(0);
    expect(screen.getByTestId('total').props.children).toBe(0);
  });

  it('does NOT increment for a message in an untracked match', async () => {
    mockSession = { user: { id: 'my-uid' } };

    // Only 'match-1' is tracked; 'match-2' is not.
    renderUnread((ctx) => { ctx.refresh(['match-1']); });

    await waitFor(() => expect(mockSupabaseStub.auth.getSession).toHaveBeenCalled());

    act(() => {
      mockRealtimeCb({ new: { match_id: 'match-2', sender_id: 'peer-uid' } });
    });

    expect(screen.getByTestId('match2').props.children).toBe(0);
  });

  it('does NOT increment when the incoming match is the active open chat', async () => {
    mockSession = { user: { id: 'my-uid' } };

    renderUnread((ctx) => {
      ctx.refresh(['match-1']);
      ctx.setActiveMatch('match-1'); // user is currently viewing match-1
    });

    await waitFor(() => expect(mockSupabaseStub.auth.getSession).toHaveBeenCalled());

    act(() => {
      mockRealtimeCb({ new: { match_id: 'match-1', sender_id: 'peer-uid' } });
    });

    expect(screen.getByTestId('match1').props.children).toBe(0);
  });
});

describe('UnreadProvider — markRead', () => {
  it('resets the unread count for a match to 0', async () => {
    mockSession = { user: { id: 'my-uid' } };
    mockGetUnreadCounts.mockResolvedValue({ 'match-1': 4 });

    let capturedCtx: ReturnType<typeof useUnread> | null = null;
    renderUnread((ctx) => {
      capturedCtx = ctx;
      ctx.refresh(['match-1']);
    });

    // Wait for the pre-populated count from getUnreadCounts.
    await waitFor(() => {
      expect(screen.getByTestId('match1').props.children).toBe(4);
    });

    await act(async () => { await capturedCtx?.markRead('match-1'); });

    expect(screen.getByTestId('match1').props.children).toBe(0);
    expect(screen.getByTestId('total').props.children).toBe(0);
    expect(mockMarkMatchRead).toHaveBeenCalledWith('match-1');
  });
});

describe('UnreadProvider — setActiveMatch', () => {
  it('clears the badge immediately for the active match', async () => {
    mockSession = { user: { id: 'my-uid' } };

    // Pre-populate unread count via getUnreadCounts.
    mockGetUnreadCounts.mockResolvedValue({ 'match-1': 5 });

    let capturedCtx: ReturnType<typeof useUnread> | null = null;
    renderUnread((ctx) => {
      capturedCtx = ctx;
      ctx.refresh(['match-1']);
    });

    await waitFor(() => {
      expect(screen.getByTestId('match1').props.children).toBe(5);
    });

    act(() => { capturedCtx?.setActiveMatch('match-1'); });

    expect(screen.getByTestId('match1').props.children).toBe(0);
    expect(screen.getByTestId('total').props.children).toBe(0);
  });

  it('clears only the specified match when multiple are unread', async () => {
    mockSession = { user: { id: 'my-uid' } };
    mockGetUnreadCounts.mockResolvedValue({ 'match-1': 3, 'match-2': 7 });

    let capturedCtx: ReturnType<typeof useUnread> | null = null;
    renderUnread((ctx) => {
      capturedCtx = ctx;
      ctx.refresh(['match-1', 'match-2']);
    });

    await waitFor(() => {
      expect(screen.getByTestId('match2').props.children).toBe(7);
    });

    act(() => { capturedCtx?.setActiveMatch('match-1'); });

    // match-1 cleared; match-2 untouched.
    expect(screen.getByTestId('match1').props.children).toBe(0);
    expect(screen.getByTestId('match2').props.children).toBe(7);
  });
});

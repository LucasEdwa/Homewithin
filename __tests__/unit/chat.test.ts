// ─── Supabase mock (shared by getMessages + subscribeToMessages suites) ──────

interface MockCfg {
  enabled: boolean;
  authUser: { id: string } | null;
  messageRows: any[];
  messageError: { message: string } | null;
}

const mockCfg: MockCfg = {
  enabled: false,
  authUser: null,
  messageRows: [],
  messageError: null,
};

// Capture per-event handlers registered via .on() and the subscribe status callback.
let mockInsertHandler: ((payload: any) => void) = () => {};
let mockUpdateHandler: ((payload: any) => void) = () => {};
let mockSubscribeCb: ((status: string) => void) = () => {};

const mockChannelStub = {
  on: jest.fn().mockImplementation((_type: string, opts: { event: string }, cb: (p: any) => void) => {
    if (opts.event === 'INSERT') mockInsertHandler = cb;
    if (opts.event === 'UPDATE') mockUpdateHandler = cb;
    return mockChannelStub;
  }),
  subscribe: jest.fn().mockImplementation((cb: (status: string) => void) => {
    mockSubscribeCb = cb;
    return mockChannelStub;
  }),
};

const mockQueryBuilder: any = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(() =>
    Promise.resolve({ data: mockCfg.messageRows, error: mockCfg.messageError }),
  ),
};

const mockSupabaseStub = {
  auth: {
    getUser: jest.fn().mockImplementation(() =>
      Promise.resolve({ data: { user: mockCfg.authUser } }),
    ),
  },
  from: jest.fn().mockReturnValue(mockQueryBuilder),
  channel: jest.fn().mockReturnValue(mockChannelStub),
  removeChannel: jest.fn(),
};

jest.mock('@/services/supabase', () => ({
  get supabase() {
    return mockCfg.enabled ? mockSupabaseStub : null;
  },
  isSupabaseConfigured: true,
  async currentUserId() {
    if (!mockCfg.enabled || !mockCfg.authUser) return null;
    return mockCfg.authUser.id;
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  containsCrisisKeywords,
  getMessages,
  subscribeToMessages,
} from '@/services/social/chat';

// ─── Reset state before each test ────────────────────────────────────────────

beforeEach(() => {
  mockCfg.enabled = false;
  mockCfg.authUser = null;
  mockCfg.messageRows = [];
  mockCfg.messageError = null;
  mockInsertHandler = () => {};
  mockUpdateHandler = () => {};
  mockSubscribeCb = () => {};
  jest.clearAllMocks();
  // Re-apply default return values after clearAllMocks
  mockChannelStub.on.mockImplementation(
    (_type: string, opts: { event: string }, cb: (p: any) => void) => {
      if (opts.event === 'INSERT') mockInsertHandler = cb;
      if (opts.event === 'UPDATE') mockUpdateHandler = cb;
      return mockChannelStub;
    },
  );
  mockChannelStub.subscribe.mockImplementation((cb: (status: string) => void) => {
    mockSubscribeCb = cb;
    return mockChannelStub;
  });
  mockQueryBuilder.select.mockReturnThis();
  mockQueryBuilder.eq.mockReturnThis();
  mockQueryBuilder.or.mockReturnThis();
  mockQueryBuilder.order.mockReturnThis();
  mockQueryBuilder.limit.mockImplementation(() =>
    Promise.resolve({ data: mockCfg.messageRows, error: mockCfg.messageError }),
  );
  mockSupabaseStub.from.mockReturnValue(mockQueryBuilder);
  mockSupabaseStub.channel.mockReturnValue(mockChannelStub);
});

// ─── containsCrisisKeywords ───────────────────────────────────────────────────

describe('containsCrisisKeywords', () => {
  it('returns false for normal text', () => {
    expect(containsCrisisKeywords('Hey, how are you doing today?')).toBe(false);
    expect(containsCrisisKeywords('I feel sad but I am okay')).toBe(false);
    expect(containsCrisisKeywords('')).toBe(false);
  });

  it('detects "suicide"', () => {
    expect(containsCrisisKeywords('I am thinking about suicide')).toBe(true);
  });

  it('detects "kill myself"', () => {
    expect(containsCrisisKeywords('I want to kill myself')).toBe(true);
  });

  it('detects "end my life"', () => {
    expect(containsCrisisKeywords('I want to end my life')).toBe(true);
  });

  it('detects "hurt myself"', () => {
    expect(containsCrisisKeywords('I keep wanting to hurt myself')).toBe(true);
  });

  it('detects "self harm"', () => {
    expect(containsCrisisKeywords('I am doing self harm')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(containsCrisisKeywords('SUICIDE is on my mind')).toBe(true);
    expect(containsCrisisKeywords('WANT TO DIE')).toBe(true);
  });

  it('detects "no reason to live"', () => {
    expect(containsCrisisKeywords('I see no reason to live anymore')).toBe(true);
  });
});

// ─── getMessages ─────────────────────────────────────────────────────────────

describe('getMessages', () => {
  it('returns [] when supabase is null', async () => {
    const result = await getMessages('match-1');
    expect(result).toEqual([]);
  });

  describe('with supabase enabled', () => {
    beforeEach(() => {
      mockCfg.enabled = true;
    });

    it('returns an empty array when the DB returns no rows', async () => {
      mockCfg.messageRows = [];
      const result = await getMessages('match-1');
      expect(result).toEqual([]);
    });

    it('queries with limit 100 and descending order', async () => {
      await getMessages('match-1');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100);
    });

    it('returns messages in chronological (ascending) order', async () => {
      // DB returns newest-first (ascending: false with limit).
      // getMessages must reverse them so oldest is first.
      mockCfg.messageRows = [
        { id: 'c', match_id: 'm1', sender_id: 'u1', body: 'third',  created_at: '2024-01-03T00:00:00Z', expires_at: null, liked: false, reply_to_id: null, reply_to_body: null, reply_to_sender_id: null },
        { id: 'b', match_id: 'm1', sender_id: 'u2', body: 'second', created_at: '2024-01-02T00:00:00Z', expires_at: null, liked: false, reply_to_id: null, reply_to_body: null, reply_to_sender_id: null },
        { id: 'a', match_id: 'm1', sender_id: 'u1', body: 'first',  created_at: '2024-01-01T00:00:00Z', expires_at: null, liked: false, reply_to_id: null, reply_to_body: null, reply_to_sender_id: null },
      ];

      const result = await getMessages('match-1');

      expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c']);
    });

    it('maps DB rows to Message shape', async () => {
      mockCfg.messageRows = [{
        id: 'msg-1',
        match_id: 'match-1',
        sender_id: 'user-1',
        body: 'Hello!',
        created_at: '2024-01-01T12:00:00Z',
        expires_at: null,
        liked: true,
        reply_to_id: 'prev-msg',
        reply_to_body: 'quoted text',
        reply_to_sender_id: 'user-2',
      }];

      const [msg] = await getMessages('match-1');

      expect(msg).toEqual({
        id: 'msg-1',
        matchId: 'match-1',
        senderId: 'user-1',
        body: 'Hello!',
        createdAt: '2024-01-01T12:00:00Z',
        expiresAt: undefined,
        liked: true,
        replyToId: 'prev-msg',
        replyToBody: 'quoted text',
        replyToSenderId: 'user-2',
      });
    });

    it('returns [] and logs error when DB query fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCfg.messageError = { message: 'permission denied' };
      mockQueryBuilder.limit.mockResolvedValue({ data: null, error: mockCfg.messageError });

      const result = await getMessages('match-1');

      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith('Get messages failed:', 'permission denied');
      spy.mockRestore();
    });
  });
});

// ─── subscribeToMessages ─────────────────────────────────────────────────────

describe('subscribeToMessages', () => {
  it('returns a no-op function when supabase is null', () => {
    const unsub = subscribeToMessages('match-1', jest.fn(), jest.fn());
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });

  describe('with supabase enabled', () => {
    beforeEach(() => {
      mockCfg.enabled = true;
    });

    it('returns a function that removes the channel', () => {
      const unsub = subscribeToMessages('match-1', jest.fn(), jest.fn());
      unsub();
      expect(mockSupabaseStub.removeChannel).toHaveBeenCalledWith(mockChannelStub);
    });

    it('calls onMessage when a non-expired INSERT event arrives', () => {
      const onMessage = jest.fn();
      subscribeToMessages('match-1', onMessage, jest.fn());

      mockInsertHandler({
        new: {
          id: 'msg-1', match_id: 'match-1', sender_id: 'u1',
          body: 'Hi', created_at: new Date().toISOString(),
          expires_at: null, liked: false,
          reply_to_id: null, reply_to_body: null, reply_to_sender_id: null,
        },
      });

      expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-1', body: 'Hi' }));
    });

    it('skips INSERT events for already-expired messages', () => {
      const onMessage = jest.fn();
      subscribeToMessages('match-1', onMessage, jest.fn());

      mockInsertHandler({
        new: {
          id: 'msg-x', match_id: 'match-1', sender_id: 'u1',
          body: 'gone', created_at: '2020-01-01T00:00:00Z',
          expires_at: '2020-01-01T01:00:00Z', // already expired
          liked: false, reply_to_id: null, reply_to_body: null, reply_to_sender_id: null,
        },
      });

      expect(onMessage).not.toHaveBeenCalled();
    });

    it('calls onMessageUpdated when an UPDATE event arrives', () => {
      const onUpdated = jest.fn();
      subscribeToMessages('match-1', jest.fn(), onUpdated);

      mockUpdateHandler({
        new: {
          id: 'msg-2', match_id: 'match-1', sender_id: 'u2',
          body: 'liked!', created_at: new Date().toISOString(),
          expires_at: null, liked: true,
          reply_to_id: null, reply_to_body: null, reply_to_sender_id: null,
        },
      });

      expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg-2', liked: true }));
    });

    it('calls onError when channel status is CHANNEL_ERROR', () => {
      const onError = jest.fn();
      subscribeToMessages('match-1', jest.fn(), jest.fn(), onError);
      mockSubscribeCb('CHANNEL_ERROR');
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('calls onError when channel status is TIMED_OUT', () => {
      const onError = jest.fn();
      subscribeToMessages('match-1', jest.fn(), jest.fn(), onError);
      mockSubscribeCb('TIMED_OUT');
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onError for SUBSCRIBED status', () => {
      const onError = jest.fn();
      subscribeToMessages('match-1', jest.fn(), jest.fn(), onError);
      mockSubscribeCb('SUBSCRIBED');
      expect(onError).not.toHaveBeenCalled();
    });

    it('does not throw when onError is omitted and CHANNEL_ERROR fires', () => {
      subscribeToMessages('match-1', jest.fn(), jest.fn()); // no onError
      expect(() => mockSubscribeCb('CHANNEL_ERROR')).not.toThrow();
    });

    it('does not throw when onError is omitted and TIMED_OUT fires', () => {
      subscribeToMessages('match-1', jest.fn(), jest.fn()); // no onError
      expect(() => mockSubscribeCb('TIMED_OUT')).not.toThrow();
    });
  });
});

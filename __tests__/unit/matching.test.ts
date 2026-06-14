// Tests for findMatches — specifically verifying that the N+1 exclusion query
// was replaced with a single NOT IN clause (performance fix).

// ─── Configurable mock state ──────────────────────────────────────────────────

interface MockCfg {
  enabled: boolean;
  authUser: { id: string } | null;
  profileRows: any[];
}

const mockCfg: MockCfg = {
  enabled: false,
  authUser: null,
  profileRows: [],
};

// Capture calls to the query builder methods we care about.
const mockNotFn = jest.fn().mockReturnThis();
const mockNeqFn = jest.fn().mockReturnThis();
const mockLimitFn = jest.fn().mockResolvedValue({ data: [], error: null });

// Fluent builder for user_profiles queries.
const mockProfileBuilder: any = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  not: mockNotFn,
  neq: mockNeqFn,
  limit: mockLimitFn,
};

// The matches table is queried three times in findMatches (myActions, theirActions)
// plus once for blocks. Each call to select() returns a fresh terminal chain.
const mockMatchesBuilder = {
  select: jest.fn().mockImplementation(() => ({
    eq: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
};

const mockBlocksBuilder = {
  select: jest.fn().mockImplementation(() => ({
    or: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
};

const mockSupabaseStub = {
  auth: {
    getUser: jest.fn().mockImplementation(() =>
      Promise.resolve({ data: { user: mockCfg.authUser } }),
    ),
  },
  from: jest.fn().mockImplementation((table: string) => {
    if (table === 'user_profiles') return mockProfileBuilder;
    if (table === 'blocks') return mockBlocksBuilder;
    return mockMatchesBuilder;
  }),
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

import { findMatches } from '@/services/social/matching';

// ─── Reset ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockCfg.enabled = false;
  mockCfg.authUser = null;
  mockCfg.profileRows = [];
  jest.clearAllMocks();

  // Re-apply implementations after clearAllMocks.
  mockNotFn.mockReturnThis();
  mockNeqFn.mockReturnThis();
  mockLimitFn.mockImplementation(() =>
    Promise.resolve({ data: mockCfg.profileRows, error: null }),
  );
  mockProfileBuilder.select.mockReturnThis();
  mockProfileBuilder.eq.mockReturnThis();
  mockProfileBuilder.contains.mockReturnThis();

  mockMatchesBuilder.select.mockImplementation(() => ({
    eq: jest.fn().mockResolvedValue({ data: [], error: null }),
  }));
  mockBlocksBuilder.select.mockImplementation(() => ({
    or: jest.fn().mockResolvedValue({ data: [], error: null }),
  }));
  mockSupabaseStub.from.mockImplementation((table: string) => {
    if (table === 'user_profiles') return mockProfileBuilder;
    if (table === 'blocks') return mockBlocksBuilder;
    return mockMatchesBuilder;
  });
});

// ─── findMatches ──────────────────────────────────────────────────────────────

describe('findMatches', () => {
  it('returns [] when supabase is null', async () => {
    const result = await findMatches('peer-support');
    expect(result).toEqual([]);
  });

  it('returns [] when no authenticated user', async () => {
    mockCfg.enabled = true;
    mockCfg.authUser = null;
    const result = await findMatches('peer-support');
    expect(result).toEqual([]);
  });

  describe('with supabase enabled and authenticated user', () => {
    beforeEach(() => {
      mockCfg.enabled = true;
      mockCfg.authUser = { id: 'my-uid' };
    });

    it('returns [] when no profiles match', async () => {
      const result = await findMatches('peer-support');
      expect(result).toEqual([]);
    });

    it('uses NOT IN to exclude users — never chains .neq()', async () => {
      await findMatches('peer-support');

      // Must call .not() with the NOT IN pattern.
      expect(mockNotFn).toHaveBeenCalledWith(
        'user_id',
        'in',
        expect.stringMatching(/^\(.*my-uid.*\)$/),
      );
      // Must NEVER call .neq() (the old N+1 pattern).
      expect(mockNeqFn).not.toHaveBeenCalled();
    });

    it('includes the current user in the exclusion list', async () => {
      await findMatches('peer-support');

      const [, , exclusionArg] = mockNotFn.mock.calls[0];
      expect(exclusionArg).toContain('my-uid');
    });

    it('includes extra excluded users alongside self in the NOT IN list', async () => {
      // Simulate the user having previously acted on two other users.
      mockMatchesBuilder.select.mockImplementation((col: string) => {
        if (col === 'target_id') {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [{ target_id: 'acted-on-1' }, { target_id: 'acted-on-2' }],
              error: null,
            }),
          };
        }
        return {
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      await findMatches('peer-support');

      const [, , exclusionArg] = mockNotFn.mock.calls[0];
      expect(exclusionArg).toContain('my-uid');
      expect(exclusionArg).toContain('acted-on-1');
      expect(exclusionArg).toContain('acted-on-2');
      expect(mockNeqFn).not.toHaveBeenCalled();
    });

    it('applies the limit of 10 by default', async () => {
      await findMatches('peer-support');
      expect(mockLimitFn).toHaveBeenCalledWith(10);
    });

    it('respects a custom limit argument', async () => {
      await findMatches('peer-support', 5);
      expect(mockLimitFn).toHaveBeenCalledWith(5);
    });

    it('maps profile rows to PeerProfile shape', async () => {
      mockCfg.profileRows = [
        {
          user_id: 'peer-1',
          nickname: 'Alex',
          age_range: '25–34',
          language: 'Portuguese',
          country: 'Brazil',
          needs: ['anxiety support'],
          intentions: ['peer-support'],
          avatar_url: 'https://example.com/avatar.jpg',
        },
      ];

      const result = await findMatches('peer-support');

      expect(result).toEqual([
        {
          userId: 'peer-1',
          nickname: 'Alex',
          ageRange: '25–34',
          language: 'Portuguese',
          country: 'Brazil',
          needs: ['anxiety support'],
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      ]);
    });

    it('sets optional fields to undefined when DB columns are null', async () => {
      mockCfg.profileRows = [
        {
          user_id: 'peer-2',
          nickname: 'Jordan',
          age_range: null,
          language: null,
          country: null,
          needs: null,
          intentions: ['peer-support'],
          avatar_url: null,
        },
      ];

      const result = await findMatches('peer-support');

      expect(result[0]).toMatchObject({
        userId: 'peer-2',
        nickname: 'Jordan',
        ageRange: undefined,
        language: undefined,
        country: undefined,
        needs: [],
        avatarUrl: undefined,
      });
    });
  });
});

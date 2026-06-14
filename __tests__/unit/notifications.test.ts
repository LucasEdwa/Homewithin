// Tests for getInitialNotificationMatchId (cold-start fix) and
// addNotificationResponseListener (foreground/background notification routing).

// ─── Mocks ───────────────────────────────────────────────────────────────────
// jest-expo already sets Platform.OS = 'ios' for unit tests, so notifications.ts
// will initialize Notif from expo-notifications — no react-native override needed.

jest.mock('expo-constants', () => ({
  default: {
    executionEnvironment: 'standalone', // NOT 'storeClient' — not Expo Go
    expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  },
  executionEnvironment: 'standalone',
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));

// Create all functions as jest.fn() inside the factory so they exist from the
// moment the module is resolved (avoids hoisting issues with closure variables).
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: () => ({
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'test-uid' } } }),
    },
  },
  isSupabaseConfigured: true,
  async currentUserId() { return 'test-uid'; },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import * as ExpoNotifications from 'expo-notifications';
import {
  getInitialNotificationMatchId,
  addNotificationResponseListener,
} from '@/services/social/notifications';

// Typed aliases for the jest mock functions.
const mockGetLast =
  ExpoNotifications.getLastNotificationResponseAsync as jest.Mock;
const mockAddListener =
  ExpoNotifications.addNotificationResponseReceivedListener as jest.Mock;

// ─── Reset ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockAddListener.mockReturnValue({ remove: jest.fn() });
});

// ─── getInitialNotificationMatchId ───────────────────────────────────────────

describe('getInitialNotificationMatchId', () => {
  it('returns null when no notification launched the app', async () => {
    mockGetLast.mockResolvedValue(null);
    expect(await getInitialNotificationMatchId()).toBeNull();
  });

  it('returns the matchId from a chat notification', async () => {
    mockGetLast.mockResolvedValue({
      notification: { request: { content: { data: { matchId: 'match-abc-123' } } } },
    });
    expect(await getInitialNotificationMatchId()).toBe('match-abc-123');
  });

  it('returns null when notification data carries screen but no matchId (like notification)', async () => {
    mockGetLast.mockResolvedValue({
      notification: { request: { content: { data: { screen: 'connect' } } } },
    });
    expect(await getInitialNotificationMatchId()).toBeNull();
  });

  it('returns null when notification data is an empty object', async () => {
    mockGetLast.mockResolvedValue({
      notification: { request: { content: { data: {} } } },
    });
    expect(await getInitialNotificationMatchId()).toBeNull();
  });

  it('returns null when notification content.data is null', async () => {
    mockGetLast.mockResolvedValue({
      notification: { request: { content: { data: null } } },
    });
    expect(await getInitialNotificationMatchId()).toBeNull();
  });

  it('returns null (does not throw) when getLastNotificationResponseAsync rejects', async () => {
    mockGetLast.mockRejectedValue(new Error('OS error'));
    await expect(getInitialNotificationMatchId()).resolves.toBeNull();
  });

  it('calls getLastNotificationResponseAsync exactly once', async () => {
    mockGetLast.mockResolvedValue(null);
    await getInitialNotificationMatchId();
    expect(mockGetLast).toHaveBeenCalledTimes(1);
  });
});

// ─── addNotificationResponseListener ─────────────────────────────────────────

describe('addNotificationResponseListener', () => {
  function setupListener() {
    let capturedCb: ((response: any) => void) = () => {};
    mockAddListener.mockImplementation((cb) => {
      capturedCb = cb;
      return { remove: jest.fn() };
    });
    return () => capturedCb;
  }

  it('calls onMatchId when a chat notification is tapped', () => {
    const getCb = setupListener();
    const onMatchId = jest.fn();
    const onScreen = jest.fn();
    addNotificationResponseListener(onMatchId, onScreen);

    getCb()({
      notification: { request: { content: { data: { matchId: 'match-xyz' } } } },
    });

    expect(onMatchId).toHaveBeenCalledWith('match-xyz');
    expect(onScreen).not.toHaveBeenCalled();
  });

  it('calls onScreen when a like notification is tapped', () => {
    const getCb = setupListener();
    const onMatchId = jest.fn();
    const onScreen = jest.fn();
    addNotificationResponseListener(onMatchId, onScreen);

    getCb()({
      notification: { request: { content: { data: { screen: 'connect' } } } },
    });

    expect(onScreen).toHaveBeenCalledWith('connect');
    expect(onMatchId).not.toHaveBeenCalled();
  });

  it('does not throw when onScreen is omitted and a screen notification arrives', () => {
    const getCb = setupListener();
    const onMatchId = jest.fn();
    addNotificationResponseListener(onMatchId); // onScreen intentionally omitted

    expect(() => {
      getCb()({
        notification: { request: { content: { data: { screen: 'connect' } } } },
      });
    }).not.toThrow();

    expect(onMatchId).not.toHaveBeenCalled();
  });

  it('returns an object with a remove function', () => {
    const sub = addNotificationResponseListener(jest.fn());
    expect(typeof sub.remove).toBe('function');
  });

  it('does not call either callback when data is empty', () => {
    const getCb = setupListener();
    const onMatchId = jest.fn();
    const onScreen = jest.fn();
    addNotificationResponseListener(onMatchId, onScreen);

    getCb()({
      notification: { request: { content: { data: {} } } },
    });

    expect(onMatchId).not.toHaveBeenCalled();
    expect(onScreen).not.toHaveBeenCalled();
  });
});

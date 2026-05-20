import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@/services/social/matching', () => ({
  syncProfile: jest.fn().mockResolvedValue(undefined),
  findMatches: jest.fn(),
  connectMatch: jest.fn(),
  passMatch: jest.fn(),
  getMyMatches: jest.fn(),
  getPendingOutgoing: jest.fn(),
  getIncomingLikes: jest.fn(),
  acceptIncomingLike: jest.fn(),
  declineIncomingLike: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = cb();
      return cleanup ?? undefined;
    }, []);
  },
}));

jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    profile: {
      nickname: 'TestUser',
      pronouns: '',
      ageRange: '18–24',
      language: 'English',
      country: 'Brazil',
      hideFromSearch: false,
      needs: ['someone_to_talk'],
      isAnonymous: true,
    },
  }),
}));

import ConnectScreen from '@/app/(tabs)/connect';
import * as matchingService from '@/services/social/matching';
import { router } from 'expo-router';

const mockFind = matchingService.findMatches as jest.Mock;
const mockConnect = matchingService.connectMatch as jest.Mock;
const mockPass = matchingService.passMatch as jest.Mock;
const mockGetMatches = matchingService.getMyMatches as jest.Mock;
const mockGetPending = matchingService.getPendingOutgoing as jest.Mock;
const mockGetIncoming = matchingService.getIncomingLikes as jest.Mock;

const SAMPLE_PEER = {
  userId: 'peer-uuid-1',
  nickname: 'AlexQ',
  ageRange: '18–24',
  language: 'English',
  country: 'Canada',
  needs: ['family_rejection'],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFind.mockResolvedValue([]);
  mockConnect.mockResolvedValue({ matchId: null, mutual: false });
  mockPass.mockResolvedValue(undefined);
  mockGetMatches.mockResolvedValue([]);
  mockGetPending.mockResolvedValue([]);
  mockGetIncoming.mockResolvedValue([]);
});

describe('ConnectScreen — intentions', () => {
  it('renders the screen title', async () => {
    render(<ConnectScreen />);
    await waitFor(() => expect(screen.getByText('Connect')).toBeTruthy());
  });

  it('renders intention cards', async () => {
    render(<ConnectScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('intention-family_rejection')).toBeTruthy();
      expect(screen.getByTestId('intention-first_friend')).toBeTruthy();
      expect(screen.getByTestId('intention-mentor')).toBeTruthy();
      expect(screen.getByTestId('intention-listener')).toBeTruthy();
      expect(screen.getByTestId('intention-support_group')).toBeTruthy();
    });
  });

  it('shows safety note', async () => {
    render(<ConnectScreen />);
    await waitFor(() => expect(screen.getByText(/anonymous/i)).toBeTruthy());
  });
});

describe('ConnectScreen — browsing', () => {
  it('shows empty state when no matches found', async () => {
    mockFind.mockResolvedValue([]);
    render(<ConnectScreen />);
    await waitFor(() => screen.getByTestId('intention-listener'));
    fireEvent.press(screen.getByTestId('intention-listener'));
    await waitFor(() => expect(screen.getByText(/No more matches/i)).toBeTruthy());
  });

  it('shows match card when candidates available', async () => {
    mockFind.mockResolvedValue([SAMPLE_PEER]);
    render(<ConnectScreen />);
    await waitFor(() => screen.getByTestId('intention-listener'));
    fireEvent.press(screen.getByTestId('intention-listener'));
    await waitFor(() => expect(screen.getByText('AlexQ')).toBeTruthy());
  });

  it('calls connectMatch on Connect press', async () => {
    mockFind.mockResolvedValue([SAMPLE_PEER]);
    render(<ConnectScreen />);
    await waitFor(() => screen.getByTestId('intention-listener'));
    fireEvent.press(screen.getByTestId('intention-listener'));
    await waitFor(() => screen.getByTestId('connect-btn'));
    fireEvent.press(screen.getByTestId('connect-btn'));
    await waitFor(() =>
      expect(mockConnect).toHaveBeenCalledWith(SAMPLE_PEER.userId, 'listener')
    );
  });

  it('calls passMatch on Pass press', async () => {
    mockFind.mockResolvedValue([SAMPLE_PEER]);
    render(<ConnectScreen />);
    await waitFor(() => screen.getByTestId('intention-listener'));
    fireEvent.press(screen.getByTestId('intention-listener'));
    await waitFor(() => screen.getByTestId('pass-btn'));
    fireEvent.press(screen.getByTestId('pass-btn'));
    await waitFor(() =>
      expect(mockPass).toHaveBeenCalledWith(SAMPLE_PEER.userId, 'listener')
    );
  });

  it('shows empty state after last candidate is acted on', async () => {
    mockFind.mockResolvedValue([SAMPLE_PEER]);
    render(<ConnectScreen />);
    await waitFor(() => screen.getByTestId('intention-listener'));
    fireEvent.press(screen.getByTestId('intention-listener'));
    await waitFor(() => screen.getByTestId('pass-btn'));
    fireEvent.press(screen.getByTestId('pass-btn'));
    await waitFor(() => expect(screen.getByText(/No more matches/i)).toBeTruthy());
  });
});

describe('ConnectScreen — existing connections', () => {
  it('shows existing connections list', async () => {
    mockGetMatches.mockResolvedValue([
      {
        id: 'match-1',
        requesterId: 'me',
        targetId: 'peer-1',
        intention: 'listener',
        status: 'accepted',
        createdAt: new Date().toISOString(),
        peer: { userId: 'peer-1', nickname: 'Jordan', country: 'Brazil', needs: [] },
      },
    ]);
    render(<ConnectScreen />);
    await waitFor(() => expect(screen.getByText('Jordan')).toBeTruthy());
  });

  it('navigates to chat on connection tap', async () => {
    mockGetMatches.mockResolvedValue([
      {
        id: 'match-1',
        requesterId: 'me',
        targetId: 'peer-1',
        intention: 'listener',
        status: 'accepted',
        createdAt: new Date().toISOString(),
        peer: { userId: 'peer-1', nickname: 'Jordan', country: 'Brazil', needs: [] },
      },
    ]);
    render(<ConnectScreen />);
    await waitFor(() => screen.getByTestId('match-match-1'));
    fireEvent.press(screen.getByTestId('match-match-1'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/chat',
      params: { matchId: 'match-1', nickname: 'Jordan' },
    });
  });
});

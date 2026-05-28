import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import CircleChatScreen from '@/app/(social)/circle';
import * as chatService from '@/services/social/chat';
import * as circlesService from '@/services/social/circles';
import { useLocalSearchParams } from 'expo-router';

jest.mock('@/services/social/circles', () => ({
  getCircleMessages: jest.fn(),
  getCircleMembers: jest.fn().mockResolvedValue([]),
  sendCircleMessage: jest.fn(),
  subscribeToCircleMessages: jest.fn(),
  leaveCircle: jest.fn(),
  reportInCircle: jest.fn(),
}));

jest.mock('@/services/social/chat', () => ({
  containsCrisisKeywords: jest.fn(),
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'my-user-id' } } }) },
  },
  isSupabaseConfigured: true,
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

const mockGetMessages = circlesService.getCircleMessages as jest.Mock;
const mockSend = circlesService.sendCircleMessage as jest.Mock;
const mockSubscribe = circlesService.subscribeToCircleMessages as jest.Mock;
const mockLeave = circlesService.leaveCircle as jest.Mock;
const mockReport = circlesService.reportInCircle as jest.Mock;
const mockCrisis = chatService.containsCrisisKeywords as jest.Mock;
const mockParams = useLocalSearchParams as jest.Mock;

const SAMPLE_MESSAGES = [
  {
    id: 'cm-1',
    circleId: 'circle-1',
    senderId: 'my-user-id',
    senderNickname: 'Me',
    body: 'Hello circle!',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cm-2',
    circleId: 'circle-1',
    senderId: 'peer-id',
    senderNickname: 'AlexQ',
    body: 'Welcome!',
    createdAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({ circleId: 'circle-1', name: 'Family Rejection Survivors' });
  mockGetMessages.mockResolvedValue(SAMPLE_MESSAGES);
  mockSend.mockResolvedValue({
    id: 'cm-3',
    circleId: 'circle-1',
    senderId: 'my-user-id',
    body: 'New message',
    createdAt: new Date().toISOString(),
  });
  mockSubscribe.mockReturnValue(() => {});
  mockCrisis.mockReturnValue(false);
  mockLeave.mockResolvedValue(true);
  mockReport.mockResolvedValue(undefined);
});

describe('CircleChatScreen', () => {
  it('renders the circle name in the header', async () => {
    render(<CircleChatScreen />);
    await waitFor(() =>
      expect(screen.getByText('Family Rejection Survivors')).toBeTruthy()
    );
  });

  it('renders the safety banner', async () => {
    render(<CircleChatScreen />);
    await waitFor(() =>
      expect(screen.getByText(/leave or report anytime/i)).toBeTruthy()
    );
  });

  it('renders existing messages', async () => {
    render(<CircleChatScreen />);
    await waitFor(() => {
      expect(screen.getByText('Hello circle!')).toBeTruthy();
      expect(screen.getByText('Welcome!')).toBeTruthy();
    });
  });

  it('renders sender nickname on other-user messages', async () => {
    render(<CircleChatScreen />);
    await waitFor(() => expect(screen.getByText('AlexQ')).toBeTruthy());
  });

  it('renders message input', async () => {
    render(<CircleChatScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('circle-message-input')).toBeTruthy()
    );
  });

  it('send button is disabled when input is empty', async () => {
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByTestId('circle-send-btn'));
    const btn = screen.getByTestId('circle-send-btn');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it('calls sendCircleMessage on send', async () => {
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByTestId('circle-message-input'));
    fireEvent.changeText(screen.getByTestId('circle-message-input'), 'Hey everyone');
    fireEvent.press(screen.getByTestId('circle-send-btn'));
    await waitFor(() =>
      expect(mockSend).toHaveBeenCalledWith('circle-1', 'Hey everyone')
    );
  });

  it('shows crisis banner when crisis keywords detected', async () => {
    mockCrisis.mockReturnValue(true);
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByTestId('circle-message-input'));
    fireEvent.changeText(screen.getByTestId('circle-message-input'), 'I want to hurt myself');
    fireEvent.press(screen.getByTestId('circle-send-btn'));
    await waitFor(() => expect(screen.getByText(/Trevor Project/i)).toBeTruthy());
  });

  it('subscribes on mount and unsubscribes on unmount', async () => {
    const unsub = jest.fn();
    mockSubscribe.mockReturnValue(unsub);
    const { unmount } = render(<CircleChatScreen />);
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalledWith('circle-1', expect.any(Function)));
    unmount();
    expect(unsub).toHaveBeenCalled();
  });

  it('shows empty state when no messages', async () => {
    mockGetMessages.mockResolvedValue([]);
    render(<CircleChatScreen />);
    await waitFor(() =>
      expect(screen.getByText(/No messages yet/i)).toBeTruthy()
    );
  });
});

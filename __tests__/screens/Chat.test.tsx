import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ActionSheetIOS, Alert } from 'react-native';

import ChatScreen from '@/app/(social)/chat';
import * as chatService from '@/services/social/chat';
import { router, useLocalSearchParams } from 'expo-router';

jest.mock('@/services/social/chat', () => ({
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  subscribeToMessages: jest.fn(),
  containsCrisisKeywords: jest.fn(),
  deleteMessage: jest.fn(),
  applyExpiryToMatch: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/services/social/matching', () => ({
  blockUser: jest.fn(),
  reportMessage: jest.fn(),
}));

jest.mock('@/context/UnreadContext', () => ({
  useUnread: () => ({
    unreadByMatch: {},
    totalUnread: 0,
    refresh: jest.fn().mockResolvedValue(undefined),
    markRead: jest.fn().mockResolvedValue(undefined),
    setActiveMatch: jest.fn(),
  }),
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

const mockGetMessages = chatService.getMessages as jest.Mock;
const mockSendMessage = chatService.sendMessage as jest.Mock;
const mockSubscribe = chatService.subscribeToMessages as jest.Mock;
const mockCrisis = chatService.containsCrisisKeywords as jest.Mock;
const mockParams = useLocalSearchParams as jest.Mock;

const SAMPLE_MESSAGES = [
  {
    id: 'msg-1',
    matchId: 'match-1',
    senderId: 'my-user-id',
    body: 'Hello there!',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    matchId: 'match-1',
    senderId: 'peer-id',
    body: 'Hi, how are you?',
    createdAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({ matchId: 'match-1', nickname: 'AlexQ' });
  mockGetMessages.mockResolvedValue(SAMPLE_MESSAGES);
  mockSendMessage.mockResolvedValue({
    id: 'msg-3',
    matchId: 'match-1',
    senderId: 'my-user-id',
    body: 'New message',
    createdAt: new Date().toISOString(),
  });
  mockSubscribe.mockReturnValue(() => {});
  mockCrisis.mockReturnValue(false);
});

describe('ChatScreen', () => {
  it('renders the peer nickname in header', async () => {
    render(<ChatScreen />);
    await waitFor(() => expect(screen.getByText('AlexQ')).toBeTruthy());
  });

  it('renders the safety banner', async () => {
    render(<ChatScreen />);
    await waitFor(() => expect(screen.getByText(/block or report/i)).toBeTruthy());
  });

  it('renders existing messages', async () => {
    render(<ChatScreen />);
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeTruthy();
      expect(screen.getByText('Hi, how are you?')).toBeTruthy();
    });
  });

  it('renders message input', async () => {
    render(<ChatScreen />);
    await waitFor(() => expect(screen.getByTestId('message-input')).toBeTruthy());
  });

  it('send button is disabled when input is empty', async () => {
    render(<ChatScreen />);
    await waitFor(() => screen.getByTestId('send-btn'));
    const sendBtn = screen.getByTestId('send-btn');
    expect(sendBtn.props.accessibilityState?.disabled ?? sendBtn.props.disabled).toBeTruthy();
  });

  it('calls sendMessage on send', async () => {
    render(<ChatScreen />);
    await waitFor(() => screen.getByTestId('message-input'));
    fireEvent.changeText(screen.getByTestId('message-input'), 'Hello!');
    fireEvent.press(screen.getByTestId('send-btn'));
    await waitFor(() =>
      expect(mockSendMessage).toHaveBeenCalledWith('match-1', 'Hello!', null)
    );
  });

  it('shows crisis banner when crisis keywords detected', async () => {
    mockCrisis.mockReturnValue(true);
    render(<ChatScreen />);
    await waitFor(() => screen.getByTestId('message-input'));
    fireEvent.changeText(screen.getByTestId('message-input'), 'I want to hurt myself');
    fireEvent.press(screen.getByTestId('send-btn'));
    await waitFor(() => expect(screen.getByText(/Trevor Project/i)).toBeTruthy());
  });

  it('sends with disappearing mode when toggle is on', async () => {
    const spy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_opts: any, callback: (idx: number) => void) => callback(3)); // '24 hours'
    render(<ChatScreen />);
    await waitFor(() => screen.getByLabelText('Auto-delete messages off'));
    fireEvent.press(screen.getByLabelText('Auto-delete messages off'));
    fireEvent.changeText(screen.getByTestId('message-input'), 'Private');
    fireEvent.press(screen.getByTestId('send-btn'));
    await waitFor(() =>
      expect(mockSendMessage).toHaveBeenCalledWith('match-1', 'Private', 24)
    );
    spy.mockRestore();
  });

  it('shows empty state when no messages', async () => {
    mockGetMessages.mockResolvedValue([]);
    render(<ChatScreen />);
    await waitFor(() => expect(screen.getByText(/Say hello/i)).toBeTruthy());
  });

  it('navigates back on back press', async () => {
    render(<ChatScreen />);
    await waitFor(() => screen.getByLabelText('Back'));
    fireEvent.press(screen.getByLabelText('Back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('blocks a message containing objectionable content and does not call sendMessage', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<ChatScreen />);
    await waitFor(() => screen.getByTestId('message-input'));
    fireEvent.changeText(screen.getByTestId('message-input'), "i'll kill you");
    fireEvent.press(screen.getByTestId('send-btn'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Message blocked', expect.stringMatching(/community guidelines/i))
    );
    expect(mockSendMessage).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('own message bubble is accessible with delete label', async () => {
    render(<ChatScreen />);
    await waitFor(() => screen.getByText('Hello there!'));
    const ownBubble = screen.getByLabelText('Your message, long press to delete');
    expect(ownBubble).toBeTruthy();
  });

  it('long-pressing own message shows delete confirmation', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (chatService.deleteMessage as jest.Mock).mockResolvedValue(true);
    render(<ChatScreen />);
    await waitFor(() => screen.getByLabelText('Your message, long press to delete'));
    fireEvent(screen.getByLabelText('Your message, long press to delete'), 'longPress');
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Delete message?', expect.any(String), expect.any(Array))
    );
    alertSpy.mockRestore();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import CircleChatScreen from '@/app/(social)/circle';
import * as chatService from '@/services/social/chat';
import * as circlesService from '@/services/social/circles';
import * as matchingService from '@/services/social/matching';
import * as storageService from '@/services/storage';
import * as aiService from '@/services/wellness/ai';
import { useLocalSearchParams } from 'expo-router';

jest.mock('@/services/social/circles', () => ({
  getCircleMessages: jest.fn(),
  getCircle: jest.fn(),
  getCircleMembers: jest.fn().mockResolvedValue([]),
  sendCircleMessage: jest.fn(),
  subscribeToCircleMessages: jest.fn(),
  leaveCircle: jest.fn(),
  reportInCircle: jest.fn(),
  deleteCircleMessage: jest.fn(),
  kickCircleMember: jest.fn(),
}));

jest.mock('@/services/social/matching', () => ({
  blockUser: jest.fn(),
  getBlockedUserIds: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/social/chat', () => ({
  containsCrisisKeywords: jest.fn(),
}));

jest.mock('@/services/storage', () => ({
  hasCircleAIConsent: jest.fn().mockResolvedValue(true),
  grantCircleAIConsent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/wellness/ai', () => ({
  AI_DISCLAIMER: 'AI is not a therapist or crisis counselor. If you are in danger, use the emergency button.',
  sendCircleAIMessage: jest.fn(),
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
const mockGetCircle = circlesService.getCircle as jest.Mock;
const mockGetMembers = circlesService.getCircleMembers as jest.Mock;
const mockSend = circlesService.sendCircleMessage as jest.Mock;
const mockSubscribe = circlesService.subscribeToCircleMessages as jest.Mock;
const mockLeave = circlesService.leaveCircle as jest.Mock;
const mockReport = circlesService.reportInCircle as jest.Mock;
const mockBlock = matchingService.blockUser as jest.Mock;
const mockBlockedIds = matchingService.getBlockedUserIds as jest.Mock;
const mockCrisis = chatService.containsCrisisKeywords as jest.Mock;
const mockHasCircleAIConsent = storageService.hasCircleAIConsent as jest.Mock;
const mockGrantCircleAIConsent = storageService.grantCircleAIConsent as jest.Mock;
const mockSendCircleAIMessage = aiService.sendCircleAIMessage as jest.Mock;
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

const SAMPLE_MEMBERS = [
  {
    userId: 'my-user-id',
    nickname: 'Me',
    role: 'moderator' as const,
    isMe: true,
  },
  {
    userId: 'peer-id',
    nickname: 'AlexQ',
    role: 'member' as const,
    isMe: false,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({ circleId: 'circle-1', name: 'Family Rejection Survivors' });
  mockGetCircle.mockResolvedValue({
    id: 'circle-1',
    slug: 'family-rejection-survivors',
    name: 'Family Rejection Survivors',
    description: 'Support for healing from family rejection.',
    rules: 'Be kind.',
    category: 'family',
    memberCap: 20,
    memberCount: 2,
    isMember: true,
    introSeen: true,
    createdAt: new Date().toISOString(),
  });
  mockGetMessages.mockResolvedValue(SAMPLE_MESSAGES);
  mockGetMembers.mockResolvedValue(SAMPLE_MEMBERS);
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
  mockBlock.mockResolvedValue(true);
  mockBlockedIds.mockResolvedValue([]);
  mockHasCircleAIConsent.mockResolvedValue(true);
  mockGrantCircleAIConsent.mockResolvedValue(undefined);
  mockSendCircleAIMessage.mockResolvedValue({
    message: {
      id: 'circle-ai-1',
      circleId: 'circle-1',
      senderId: 'ai-companion',
      senderNickname: 'AI Companion',
      isAI: true,
      body: 'Let us slow down together and stay with what this circle is about.',
      createdAt: new Date().toISOString(),
    },
  });
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
      expect(screen.getByText(/member menu to block, report, or remove/i)).toBeTruthy()
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

  it('shows the member actions button for other members', async () => {
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByLabelText('View circle members'));
    fireEvent.press(screen.getByLabelText('View circle members'));
    await waitFor(() => expect(screen.getByLabelText('Member actions for AlexQ')).toBeTruthy());
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
      expect(mockSend).toHaveBeenCalledWith('circle-1', 'Hey everyone', 'Family Rejection Survivors')
    );
  });

  it('calls sendCircleAIMessage when @companion is mentioned', async () => {
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByTestId('circle-message-input'));

    fireEvent.changeText(screen.getByTestId('circle-message-input'), '@companion can you help this group?');
    fireEvent.press(screen.getByTestId('circle-send-btn'));

    await waitFor(() => {
      expect(mockSendCircleAIMessage).toHaveBeenCalledWith(
        'circle-1',
        'cm-3',
      );
    });

    expect(screen.getByText('AI Companion')).toBeTruthy();
  });

  it('requires consent before first AI mention in circle chat', async () => {
    mockHasCircleAIConsent.mockResolvedValue(false);
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByTestId('circle-message-input'));

    fireEvent.changeText(screen.getByTestId('circle-message-input'), '@companion can you help this group?');
    fireEvent.press(screen.getByTestId('circle-send-btn'));

    await waitFor(() => {
      expect(screen.getByText('AI Companion in Support Circles')).toBeTruthy();
    });
    expect(mockSend).not.toHaveBeenCalled();
    expect(mockSendCircleAIMessage).not.toHaveBeenCalled();
  });

  it('resumes the pending AI request after consent is granted', async () => {
    mockHasCircleAIConsent.mockResolvedValue(false);
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByTestId('circle-message-input'));

    fireEvent.changeText(screen.getByTestId('circle-message-input'), '@companion can you help this group?');
    fireEvent.press(screen.getByTestId('circle-send-btn'));

    await waitFor(() => screen.getByText('I Agree'));
    fireEvent.press(screen.getByText('I Agree'));

    await waitFor(() => expect(mockGrantCircleAIConsent).toHaveBeenCalled());
    await waitFor(() => expect(mockSend).toHaveBeenCalledWith('circle-1', '@companion can you help this group?', 'Family Rejection Survivors'));
    await waitFor(() => expect(mockSendCircleAIMessage).toHaveBeenCalled());
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
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalledWith('circle-1', expect.any(Function), expect.any(Function)));
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

  it('blocks a message with objectionable content and does not call sendCircleMessage', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByTestId('circle-message-input'));
    fireEvent.changeText(screen.getByTestId('circle-message-input'), "i'll kill you");
    fireEvent.press(screen.getByTestId('circle-send-btn'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Message blocked', expect.stringMatching(/community guidelines/i))
    );
    expect(mockSend).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('own message bubble shows long-press delete label', async () => {
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByText('Hello circle!'));
    const ownBubble = screen.getByLabelText('Your message, long press to delete');
    expect(ownBubble).toBeTruthy();
  });

  it("other user's message bubble shows long-press report label", async () => {
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByText('Welcome!'));
    const theirBubble = screen.getByLabelText(/long press to report/i);
    expect(theirBubble).toBeTruthy();
  });

  it('long-pressing own message shows delete confirmation', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (circlesService.deleteCircleMessage as jest.Mock).mockResolvedValue(true);
    render(<CircleChatScreen />);
    await waitFor(() => screen.getByLabelText('Your message, long press to delete'));
    fireEvent(screen.getByLabelText('Your message, long press to delete'), 'longPress');
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Delete message?', expect.any(String), expect.any(Array))
    );
    alertSpy.mockRestore();
  });
});

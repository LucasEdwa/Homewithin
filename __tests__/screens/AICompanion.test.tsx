import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';

jest.mock('@/services/ai', () => ({
  sendAIMessage: jest.fn(),
  getHistory: jest.fn(),
  clearHistory: jest.fn(),
  checkRateLimit: jest.fn(),
  buildSystemPrompt: jest.fn().mockReturnValue('system prompt'),
  AI_DISCLAIMER: 'AI is not a therapist or crisis counselor. If you are in danger, use the emergency button.',
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    profile: { nickname: 'TestUser', country: 'Brazil', needs: [] },
    safetyLevel: null,
  }),
}));

jest.mock('@/services/storage', () => ({
  getCheckIns: jest.fn().mockResolvedValue([]),
  getJournalEntries: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/programs', () => ({
  getAllProgramsWithProgress: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/matching', () => ({
  getMyMatches: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/chosenFamily', () => ({
  getSupportPeople: jest.fn().mockResolvedValue([]),
}));

import AICompanionScreen from '@/app/ai-companion';
import * as aiService from '@/services/ai';

const mockSend = aiService.sendAIMessage as jest.Mock;
const mockGetHistory = aiService.getHistory as jest.Mock;
const mockClearHistory = aiService.clearHistory as jest.Mock;
const mockCheckRate = aiService.checkRateLimit as jest.Mock;

const USER_MSG = { id: 'u1', role: 'user' as const, body: 'Hello there', createdAt: new Date().toISOString() };
const AI_MSG = { id: 'a1', role: 'assistant' as const, body: 'I hear you.', createdAt: new Date().toISOString() };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetHistory.mockResolvedValue([]);
  mockCheckRate.mockResolvedValue({ allowed: true, remaining: 20 });
  mockSend.mockResolvedValue({ message: AI_MSG });
});

describe('AICompanionScreen', () => {
  it('renders disclaimer', async () => {
    render(<AICompanionScreen />);
    await waitFor(() => {
      expect(screen.getByText(/not a therapist/i)).toBeTruthy();
    });
  });

  it('shows suggested starters when no history', async () => {
    render(<AICompanionScreen />);
    await waitFor(() => {
      expect(screen.getByText("What's on your mind?")).toBeTruthy();
    });
  });

  it('hides starters when history exists', async () => {
    mockGetHistory.mockResolvedValue([USER_MSG, AI_MSG]);
    render(<AICompanionScreen />);
    await waitFor(() => {
      expect(screen.queryByText("What's on your mind?")).toBeNull();
    });
  });

  it('renders existing messages', async () => {
    mockGetHistory.mockResolvedValue([USER_MSG, AI_MSG]);
    render(<AICompanionScreen />);
    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeTruthy();
      expect(screen.getByText('I hear you.')).toBeTruthy();
    });
  });

  it('send button is disabled when input is empty', async () => {
    render(<AICompanionScreen />);
    await waitFor(() => {
      const btn = screen.getByTestId('ai-send-btn');
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('enables send button when text is typed', async () => {
    render(<AICompanionScreen />);
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestId('ai-input'), 'Hello');
    });
    const btn = screen.getByTestId('ai-send-btn');
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('calls sendAIMessage with typed text', async () => {
    mockGetHistory
      .mockResolvedValueOnce([])
      .mockResolvedValue([USER_MSG, AI_MSG]);

    render(<AICompanionScreen />);
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestId('ai-input'), 'Hello');
      fireEvent.press(screen.getByTestId('ai-send-btn'));
    });
    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith('Hello', expect.any(Object));
    });
  });

  it('sends starter prompt on press', async () => {
    mockGetHistory
      .mockResolvedValueOnce([])
      .mockResolvedValue([USER_MSG, AI_MSG]);

    render(<AICompanionScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("starter-I've been")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("starter-I've been"));
    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith(
        "I've been feeling really alone lately.",
        expect.any(Object)
      );
    });
  });

  it('shows rate limit warning when ≤5 remaining', async () => {
    mockCheckRate.mockResolvedValue({ allowed: true, remaining: 3 });
    render(<AICompanionScreen />);
    await waitFor(() => {
      expect(screen.getByText(/3 messages remaining today/i)).toBeTruthy();
    });
  });

  it('shows error from sendAIMessage', async () => {
    mockGetHistory
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);
    mockSend.mockResolvedValue({ message: null, error: 'Daily limit reached' });

    render(<AICompanionScreen />);
    await waitFor(() => {
      fireEvent.changeText(screen.getByTestId('ai-input'), 'Hello');
      fireEvent.press(screen.getByTestId('ai-send-btn'));
    });
    await waitFor(() => {
      expect(screen.getByText('Daily limit reached')).toBeTruthy();
    });
  });

  it('trash button calls clearHistory', async () => {
    mockGetHistory.mockResolvedValue([USER_MSG]);
    render(<AICompanionScreen />);
    await waitFor(() => {
      fireEvent.press(screen.getByLabelText('Clear conversation'));
    });
    expect(mockClearHistory).toHaveBeenCalled();
  });
});

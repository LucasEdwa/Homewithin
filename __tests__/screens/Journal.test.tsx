import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import JournalScreen from '@/app/(tabs)/journal';
import * as storage from '@/services/storage';

jest.mock('@/services/storage', () => ({
  getTodayCheckIn: jest.fn().mockResolvedValue(null),
  getRecentCheckIns: jest.fn().mockResolvedValue([]),
  getJournalEntries: jest.fn().mockResolvedValue([]),
}));

const mockGetToday = storage.getTodayCheckIn as jest.Mock;
const mockGetRecent = storage.getRecentCheckIns as jest.Mock;
const mockGetEntries = storage.getJournalEntries as jest.Mock;

const sampleCheckIn = {
  id: 'ci-1',
  date: '2026-05-16',
  moodScore: 4 as const,
  anxietyScore: 3,
  lonelinessScore: 4,
  safetyScore: 7,
  hardestThing: 'Work was overwhelming.',
  tags: ['work', 'fear'],
  createdAt: '2026-05-16T09:00:00Z',
};

const sampleEntry = {
  id: 'je-1',
  date: '2026-05-16',
  body: 'I felt a little lighter today.',
  emotionTags: ['hope'] as any,
  isHidden: false,
  createdAt: '2026-05-16T10:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToday.mockResolvedValue(null);
  mockGetRecent.mockResolvedValue([]);
  mockGetEntries.mockResolvedValue([]);
});

describe('JournalScreen — rendering', () => {
  it('renders the Journal title', async () => {
    render(<JournalScreen />);
    await waitFor(() => expect(screen.getByText('Journal')).toBeTruthy());
  });

  it('renders the Check in action button', async () => {
    render(<JournalScreen />);
    await waitFor(() => expect(screen.getByLabelText('Daily check-in')).toBeTruthy());
  });

  it('renders the New entry action button', async () => {
    render(<JournalScreen />);
    await waitFor(() => expect(screen.getByLabelText('New journal entry')).toBeTruthy());
  });
});

describe('JournalScreen — check-in state', () => {
  it('shows check-in CTA when no check-in done today', async () => {
    render(<JournalScreen />);
    await waitFor(() =>
      expect(screen.getByText('How are you feeling today?')).toBeTruthy()
    );
  });

  it('shows today\'s mood when checked in', async () => {
    mockGetToday.mockResolvedValue(sampleCheckIn);
    mockGetRecent.mockResolvedValue([sampleCheckIn]);
    render(<JournalScreen />);
    await waitFor(() => expect(screen.getByText('Good')).toBeTruthy());
  });

  it('shows hardest thing text when present', async () => {
    mockGetToday.mockResolvedValue(sampleCheckIn);
    mockGetRecent.mockResolvedValue([sampleCheckIn]);
    render(<JournalScreen />);
    await waitFor(() =>
      expect(screen.getByText(/"Work was overwhelming."/)).toBeTruthy()
    );
  });

  it('shows mood chart when there are recent check-ins', async () => {
    mockGetRecent.mockResolvedValue([sampleCheckIn]);
    render(<JournalScreen />);
    await waitFor(() =>
      expect(screen.getByText('Mood — last 7 days')).toBeTruthy()
    );
  });

  it('does not show mood chart when no recent check-ins', async () => {
    render(<JournalScreen />);
    await waitFor(() => screen.getByText('Journal'));
    expect(screen.queryByText('Mood — last 7 days')).toBeNull();
  });
});

describe('JournalScreen — journal entries', () => {
  it('shows empty state when no entries', async () => {
    render(<JournalScreen />);
    await waitFor(() =>
      expect(screen.getByText('No entries yet. Writing is healing.')).toBeTruthy()
    );
  });

  it('renders a journal entry preview', async () => {
    mockGetEntries.mockResolvedValue([sampleEntry]);
    render(<JournalScreen />);
    await waitFor(() =>
      expect(screen.getByText('I felt a little lighter today.')).toBeTruthy()
    );
  });

  it('shows hidden entry as locked', async () => {
    mockGetEntries.mockResolvedValue([{ ...sampleEntry, isHidden: true }]);
    render(<JournalScreen />);
    await waitFor(() =>
      expect(screen.getByText('🔒 Hidden entry')).toBeTruthy()
    );
  });
});

describe('JournalScreen — navigation', () => {
  it('pressing Check in navigates to /checkin', async () => {
    render(<JournalScreen />);
    await waitFor(() => screen.getByLabelText('Daily check-in'));
    fireEvent.press(screen.getByLabelText('Daily check-in'));
    expect(router.push).toHaveBeenCalledWith('/checkin');
  });

  it('pressing New entry navigates to /journal-entry', async () => {
    render(<JournalScreen />);
    await waitFor(() => screen.getByLabelText('New journal entry'));
    fireEvent.press(screen.getByLabelText('New journal entry'));
    expect(router.push).toHaveBeenCalledWith('/journal-entry');
  });

  it('pressing the check-in CTA navigates to /checkin', async () => {
    render(<JournalScreen />);
    await waitFor(() => screen.getByText('How are you feeling today?'));
    fireEvent.press(screen.getByText('How are you feeling today?'));
    expect(router.push).toHaveBeenCalledWith('/checkin');
  });

  it('pressing an entry row navigates to journal-entry with its id', async () => {
    mockGetEntries.mockResolvedValue([sampleEntry]);
    render(<JournalScreen />);
    await waitFor(() => screen.getByText('I felt a little lighter today.'));
    fireEvent.press(screen.getByText('I felt a little lighter today.'));
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/journal-entry', params: { id: 'je-1' } })
    );
  });
});

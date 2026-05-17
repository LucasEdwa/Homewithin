import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/services/progressStats', () => ({
  getProgressSnapshot: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    profile: {
      nickname: 'Alex',
      country: 'Brazil',
      language: 'English',
      ageRange: '18–24',
      needs: ['someone_to_talk'],
      intentions: ['listener'],
      isAnonymous: true,
    },
  }),
}));

import ProgressScreen from '@/app/progress';
import * as statsService from '@/services/progressStats';

const mockGetSnapshot = statsService.getProgressSnapshot as jest.Mock;

const FULL_SNAPSHOT = {
  moodTrend: [
    { date: '2026-05-10', mood: 3, safety: 5 },
    { date: '2026-05-11', mood: 4, safety: 7 },
    { date: '2026-05-12', mood: 5, safety: 9 },
  ],
  journalStreak: 5,
  safetyDelta: 2.3,
  connectionsCount: 3,
  lessonsCompleted: 4,
  totalLessons: 25,
  profileCompletion: 100,
  onboardingBadge: true,
};

const EMPTY_SNAPSHOT = {
  moodTrend: [],
  journalStreak: 0,
  safetyDelta: null,
  connectionsCount: 0,
  lessonsCompleted: 0,
  totalLessons: 25,
  profileCompletion: 50,
  onboardingBadge: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSnapshot.mockResolvedValue(FULL_SNAPSHOT);
});

describe('ProgressScreen — with data', () => {
  it('shows the screen title', async () => {
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByText('Your Progress')).toBeTruthy());
  });

  it('shows profile badge with completion percentage', async () => {
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByTestId('profile-badge')).toBeTruthy());
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('shows journal streak', async () => {
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByTestId('stat-streak')).toBeTruthy());
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('shows connections count', async () => {
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByTestId('stat-connections')).toBeTruthy());
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('shows lessons progress', async () => {
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByTestId('stat-lessons')).toBeTruthy());
    expect(screen.getByText('4/25')).toBeTruthy();
  });

  it('shows safety improvement indicator', async () => {
    render(<ProgressScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('stat-safety')).toBeTruthy();
      expect(screen.getByText(/\+2\.3/)).toBeTruthy();
    });
  });

  it('shows mood chart when trend data available', async () => {
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByTestId('mood-chart')).toBeTruthy());
  });

  it('shows onboarding badge when profile complete', async () => {
    render(<ProgressScreen />);
    await waitFor(() =>
      expect(screen.getByText('Profile complete')).toBeTruthy()
    );
  });

  it('shows quick action links', async () => {
    render(<ProgressScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('link-checkin')).toBeTruthy();
      expect(screen.getByTestId('link-journal')).toBeTruthy();
      expect(screen.getByTestId('link-programs')).toBeTruthy();
    });
  });
});

describe('ProgressScreen — empty state', () => {
  beforeEach(() => {
    mockGetSnapshot.mockResolvedValue(EMPTY_SNAPSHOT);
  });

  it('shows empty state for mood when no check-ins', async () => {
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByTestId('mood-empty')).toBeTruthy());
  });

  it('shows partial completion percentage', async () => {
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByText('50%')).toBeTruthy());
  });

  it('does not show onboarding badge when profile incomplete', async () => {
    render(<ProgressScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('profile-badge')).toBeTruthy();
      expect(screen.queryByText('Profile complete')).toBeNull();
    });
  });
});

describe('ProgressScreen — error state', () => {
  it('shows error state when snapshot fails', async () => {
    mockGetSnapshot.mockRejectedValue(new Error('network error'));
    render(<ProgressScreen />);
    await waitFor(() => expect(screen.getByTestId('error-state')).toBeTruthy());
  });
});

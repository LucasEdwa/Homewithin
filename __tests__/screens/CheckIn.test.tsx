import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithSession } from '../helpers/renderWithSession';

import CheckInScreen from '@/app/(wellness)/checkin';
import * as storage from '@/services/storage';

jest.mock('@/services/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

jest.mock('@/services/storage', () => ({
  saveCheckIn: jest.fn().mockResolvedValue(undefined),
  getTodayCheckIn: jest.fn().mockResolvedValue(null),
  getRecentCheckIns: jest.fn().mockResolvedValue([]),
}));

const mockGetToday = storage.getTodayCheckIn as jest.Mock;
const mockGetRecent = storage.getRecentCheckIns as jest.Mock;
const mockSave = storage.saveCheckIn as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToday.mockResolvedValue(null);
  mockGetRecent.mockResolvedValue([]);
  mockSave.mockResolvedValue(undefined);
});

const mockSession = { setSafetyLevel: jest.fn() };

describe('CheckInScreen — rendering', () => {
  it('renders the screen title', async () => {
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => expect(screen.getByText('Daily Check-In')).toBeTruthy());
  });

  it('renders all five mood options', async () => {
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => {
      expect(screen.getByLabelText('Terrible')).toBeTruthy();
      expect(screen.getByLabelText('Bad')).toBeTruthy();
      expect(screen.getByLabelText('Okay')).toBeTruthy();
      expect(screen.getByLabelText('Good')).toBeTruthy();
      expect(screen.getByLabelText('Great')).toBeTruthy();
    });
  });

  it('renders the three sliders', async () => {
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => {
      expect(screen.getByLabelText('Anxiety')).toBeTruthy();
      expect(screen.getByLabelText('Loneliness')).toBeTruthy();
      expect(screen.getByLabelText('Safety')).toBeTruthy();
    });
  });

  it('renders all trigger tags', async () => {
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => {
      expect(screen.getByText('family')).toBeTruthy();
      expect(screen.getByText('work')).toBeTruthy();
      expect(screen.getByText('identity')).toBeTruthy();
      expect(screen.getByText('loneliness')).toBeTruthy();
      expect(screen.getByText('fear')).toBeTruthy();
      expect(screen.getByText('hope')).toBeTruthy();
    });
  });

  it('renders the hardest-thing text input', async () => {
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() =>
      expect(screen.getByLabelText('What has been hardest today')).toBeTruthy()
    );
  });

  it('renders the Save button', async () => {
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => expect(screen.getByText('Save check-in')).toBeTruthy());
  });
});

describe('CheckInScreen — already checked in', () => {
  it('shows the "already checked in" banner', async () => {
    mockGetToday.mockResolvedValue({
      id: 'ci-1',
      date: '2026-05-16',
      moodScore: 4,
      anxietyScore: 3,
      lonelinessScore: 5,
      safetyScore: 8,
      hardestThing: '',
      tags: [],
      createdAt: '2026-05-16T09:00:00Z',
    });
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() =>
      expect(screen.getByText(/already checked in today/i)).toBeTruthy()
    );
  });

  it('shows "Update check-in" button when already checked in', async () => {
    mockGetToday.mockResolvedValue({
      id: 'ci-1', date: '2026-05-16', moodScore: 3,
      anxietyScore: 5, lonelinessScore: 5, safetyScore: 5,
      hardestThing: '', tags: [], createdAt: '2026-05-16T09:00:00Z',
    });
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => expect(screen.getByText('Update check-in')).toBeTruthy());
  });
});

describe('CheckInScreen — saving', () => {
  it('shows alert when saving without selecting a mood', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => screen.getByText('Save check-in'));
    fireEvent.press(screen.getByText('Save check-in'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Select a mood', expect.any(String))
    );
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('calls saveCheckIn after selecting a mood and pressing save', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      (buttons as any)?.[0]?.onPress?.();
    });
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => screen.getByLabelText('Good'));
    fireEvent.press(screen.getByLabelText('Good'));
    fireEvent.press(screen.getByText('Save check-in'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0]).toMatchObject({ moodScore: 4 });
    alertSpy.mockRestore();
  });

  it('navigates back after saving and pressing OK', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      (buttons as any)?.[0]?.onPress?.();
    });
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => screen.getByLabelText('Great'));
    fireEvent.press(screen.getByLabelText('Great'));
    fireEvent.press(screen.getByText('Save check-in'));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('updates global safety level to green for mood 4+', async () => {
    const setSafetyLevel = jest.fn();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      (buttons as any)?.[0]?.onPress?.();
    });
    renderWithSession(<CheckInScreen />, { setSafetyLevel });
    await waitFor(() => screen.getByLabelText('Great'));
    fireEvent.press(screen.getByLabelText('Great'));
    fireEvent.press(screen.getByText('Save check-in'));
    await waitFor(() => expect(setSafetyLevel).toHaveBeenCalledWith('green'));
  });

  it('sets safety level to red for mood 1 or 2', async () => {
    const setSafetyLevel = jest.fn();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      (buttons as any)?.[0]?.onPress?.();
    });
    renderWithSession(<CheckInScreen />, { setSafetyLevel });
    await waitFor(() => screen.getByLabelText('Terrible'));
    fireEvent.press(screen.getByLabelText('Terrible'));
    fireEvent.press(screen.getByText('Save check-in'));
    await waitFor(() => expect(setSafetyLevel).toHaveBeenCalledWith('red'));
  });
});

describe('CheckInScreen — navigation', () => {
  it('back button calls router.back', async () => {
    renderWithSession(<CheckInScreen />, mockSession);
    await waitFor(() => screen.getByLabelText('Go back'));
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(router.back).toHaveBeenCalled();
  });
});

import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { renderWithSession } from '../helpers/renderWithSession';

jest.mock('@/services/matching', () => ({
  syncProfile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/resources', () => ({
  getBookmarkedResources: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/account', () => ({
  deleteAccount: jest.fn().mockResolvedValue({
    localCleared: true,
    remoteCleared: true,
    signedOut: true,
    errors: [],
  }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = cb();
      return cleanup ?? undefined;
    }, []);
  },
}));

jest.mock('@/components/EmergencyButton', () => ({
  EmergencyButton: () => null,
}));

import ProfileScreen from '@/app/(tabs)/profile';
import * as accountService from '@/services/account';
import * as matchingService from '@/services/matching';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const baseProfile = {
  nickname: 'River',
  pronouns: 'they/them',
  ageRange: '18–24',
  language: 'English',
  country: 'Brazil',
  hideFromSearch: false,
  needs: ['someone_to_talk'],
  intentions: [],
  isAnonymous: true,
};

describe('ProfileScreen — Hide from search toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flips on, persists via setProfile, and syncs to backend', async () => {
    const setProfile = jest.fn().mockResolvedValue(undefined);
    renderWithSession(<ProfileScreen />, { profile: baseProfile as any, setProfile });

    const toggle = screen.getByLabelText('Hide from search');
    expect(toggle.props.value).toBe(false);

    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => {
      expect(setProfile).toHaveBeenCalledWith(
        expect.objectContaining({ hideFromSearch: true })
      );
    });
    expect(matchingService.syncProfile).toHaveBeenCalledWith(
      expect.objectContaining({ hideFromSearch: true })
    );
  });

  it('rolls back on sync failure', async () => {
    (matchingService.syncProfile as jest.Mock).mockRejectedValueOnce(new Error('network'));
    const setProfile = jest.fn().mockResolvedValue(undefined);
    renderWithSession(<ProfileScreen />, { profile: baseProfile as any, setProfile });

    const toggle = screen.getByLabelText('Hide from search');
    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => {
      // First call optimistic (true), second call rollback (false).
      expect(setProfile).toHaveBeenNthCalledWith(1, expect.objectContaining({ hideFromSearch: true }));
      expect(setProfile).toHaveBeenNthCalledWith(2, expect.objectContaining({ hideFromSearch: false }));
    });
  });

  it('flips off when starting from hidden', async () => {
    const setProfile = jest.fn().mockResolvedValue(undefined);
    renderWithSession(<ProfileScreen />, {
      profile: { ...baseProfile, hideFromSearch: true } as any,
      setProfile,
    });

    const toggle = screen.getByLabelText('Hide from search');
    expect(toggle.props.value).toBe(true);

    fireEvent(toggle, 'valueChange', false);

    await waitFor(() => {
      expect(setProfile).toHaveBeenCalledWith(
        expect.objectContaining({ hideFromSearch: false })
      );
    });
    expect(matchingService.syncProfile).toHaveBeenCalledWith(
      expect.objectContaining({ hideFromSearch: false })
    );
  });
});

describe('ProfileScreen — Delete account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a confirmation alert and does nothing on cancel', () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const reset = jest.fn();
    renderWithSession(<ProfileScreen />, { profile: baseProfile as any, reset });

    fireEvent.press(screen.getByText('Delete account & all data'));

    expect(spy).toHaveBeenCalled();
    const [title, , buttons] = spy.mock.calls[0];
    expect(title).toMatch(/Delete account/i);
    expect(buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ style: 'destructive' }),
      ])
    );
    // Cancel by simulating cancel button press.
    const cancelBtn = (buttons as any[]).find((b) => b.text === 'Cancel');
    cancelBtn.onPress?.();
    expect(accountService.deleteAccount).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
  });

  it('runs deleteAccount, resets session, and navigates to /welcome on confirm', async () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const reset = jest.fn();
    renderWithSession(<ProfileScreen />, { profile: baseProfile as any, reset });

    fireEvent.press(screen.getByText('Delete account & all data'));
    const buttons = spy.mock.calls[0][2] as any[];
    const destructive = buttons.find((b) => b.style === 'destructive');
    await destructive.onPress();

    await waitFor(() => {
      expect(accountService.deleteAccount).toHaveBeenCalled();
      expect(reset).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/welcome');
    });
  });

  it('still resets and navigates if deleteAccount throws', async () => {
    (accountService.deleteAccount as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const reset = jest.fn();
    renderWithSession(<ProfileScreen />, { profile: baseProfile as any, reset });

    fireEvent.press(screen.getByText('Delete account & all data'));
    const buttons = spy.mock.calls[0][2] as any[];
    const destructive = buttons.find((b) => b.style === 'destructive');
    await destructive.onPress();

    await waitFor(() => {
      expect(reset).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/welcome');
    });
  });
});

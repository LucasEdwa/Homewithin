import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithSession } from '../helpers/renderWithSession';

jest.mock('@/services/matching', () => ({
  syncProfile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/resources', () => ({
  getBookmarkedResources: jest.fn().mockResolvedValue([]),
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
import * as matchingService from '@/services/matching';

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

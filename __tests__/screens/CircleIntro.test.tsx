import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/services/social/circles', () => ({
  getCircle: jest.fn(),
  markCircleIntroSeen: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

import CircleIntroScreen from '@/app/(social)/circle-intro';
import * as circlesService from '@/services/social/circles';
import { router, useLocalSearchParams } from 'expo-router';

const mockGetCircle = circlesService.getCircle as jest.Mock;
const mockMarkSeen = circlesService.markCircleIntroSeen as jest.Mock;
const mockParams = useLocalSearchParams as jest.Mock;
const mockReplace = router.replace as jest.Mock;

const SAMPLE_CIRCLE = {
  id: 'circle-1',
  slug: 'family-rejection-survivors',
  name: 'Family Rejection Survivors',
  description: 'A small circle for people healing from family rejection.',
  rules: '1. What is shared here stays here.\n2. No advice unless asked.\n3. No slurs or shaming.\n4. You can leave anytime.',
  category: 'family_rejection',
  memberCap: 8,
  memberCount: 3,
  isMember: true,
  introSeen: false,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({ circleId: 'circle-1' });
  mockGetCircle.mockResolvedValue(SAMPLE_CIRCLE);
  mockMarkSeen.mockResolvedValue(undefined);
});

describe('CircleIntroScreen', () => {
  it('renders the circle name', async () => {
    render(<CircleIntroScreen />);
    await waitFor(() => expect(screen.getByText('Family Rejection Survivors')).toBeTruthy());
  });

  it('renders the member count', async () => {
    render(<CircleIntroScreen />);
    await waitFor(() => expect(screen.getByText('3 / 8 members')).toBeTruthy());
  });

  it('renders the circle description', async () => {
    render(<CircleIntroScreen />);
    await waitFor(() =>
      expect(screen.getByText(/healing from family rejection/i)).toBeTruthy()
    );
  });

  it('renders all circle rules', async () => {
    render(<CircleIntroScreen />);
    await waitFor(() => {
      expect(screen.getByText(/What is shared here stays here/i)).toBeTruthy();
      expect(screen.getByText(/No advice unless asked/i)).toBeTruthy();
      expect(screen.getByText(/No slurs or shaming/i)).toBeTruthy();
      expect(screen.getByText(/You can leave anytime/i)).toBeTruthy();
    });
  });

  it('renders the safety note about leaving or reporting', async () => {
    render(<CircleIntroScreen />);
    await waitFor(() =>
      expect(screen.getByText(/leave or report anyone/i)).toBeTruthy()
    );
  });

  it('renders the Enter circle button', async () => {
    render(<CircleIntroScreen />);
    await waitFor(() => expect(screen.getByText('Enter circle')).toBeTruthy());
  });

  it('calls markCircleIntroSeen and navigates on Enter circle press', async () => {
    render(<CircleIntroScreen />);
    await waitFor(() => screen.getByText('Enter circle'));
    fireEvent.press(screen.getByText('Enter circle'));
    await waitFor(() => {
      expect(mockMarkSeen).toHaveBeenCalledWith('circle-1');
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/circle',
        params: { circleId: 'circle-1', name: 'Family Rejection Survivors' },
      });
    });
  });

  it('shows error state when circle is not found', async () => {
    mockGetCircle.mockResolvedValue(null);
    render(<CircleIntroScreen />);
    await waitFor(() =>
      expect(screen.getByText('Circle not found.')).toBeTruthy()
    );
  });
});

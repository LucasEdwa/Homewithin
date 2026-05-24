import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import CirclesScreen from '@/app/(social)/circles';
import * as circlesService from '@/services/social/circles';
import { router } from 'expo-router';

jest.mock('@/services/social/circles', () => ({
  listCircles: jest.fn(),
  joinCircle: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useFocusEffect: (cb: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react');
    useEffect(() => {
      const cleanup = cb();
      return typeof cleanup === 'function' ? cleanup : undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  },
}));

const mockList = circlesService.listCircles as jest.Mock;
const mockJoin = circlesService.joinCircle as jest.Mock;
const mockPush = router.push as jest.Mock;

const SAMPLE_CIRCLES = [
  {
    id: 'circle-1',
    slug: 'family-rejection-survivors',
    name: 'Family Rejection Survivors',
    description: 'A circle for people healing from family rejection.',
    rules: '1. What is shared here stays here.',
    category: 'family_rejection',
    memberCap: 8,
    memberCount: 3,
    isMember: false,
    introSeen: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'circle-2',
    slug: 'newly-out',
    name: 'Newly Out',
    description: 'For folks who recently came out.',
    rules: '1. Celebrate small wins.',
    category: 'coming_out_safely',
    memberCap: 8,
    memberCount: 8,
    isMember: false,
    introSeen: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'circle-3',
    slug: 'building-confidence',
    name: 'Building Confidence',
    description: 'Rebuild self-worth.',
    rules: '1. Lift each other up.',
    category: 'internalized_shame',
    memberCap: 8,
    memberCount: 4,
    isMember: true,
    introSeen: true,
    createdAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockList.mockResolvedValue(SAMPLE_CIRCLES);
  mockJoin.mockResolvedValue({ ok: true });
});

describe('CirclesScreen', () => {
  it('renders the screen heading', async () => {
    render(<CirclesScreen />);
    await waitFor(() => expect(screen.getByText('Support Circles')).toBeTruthy());
  });

  it('renders a card for each circle', async () => {
    render(<CirclesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Family Rejection Survivors')).toBeTruthy();
      expect(screen.getByText('Newly Out')).toBeTruthy();
      expect(screen.getByText('Building Confidence')).toBeTruthy();
    });
  });

  it('shows member counts', async () => {
    render(<CirclesScreen />);
    await waitFor(() => {
      expect(screen.getByText('3 / 8 members')).toBeTruthy();
      expect(screen.getByText('8 / 8 members')).toBeTruthy();
    });
  });

  it('renders Join button for non-members', async () => {
    render(<CirclesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('join-circle-family-rejection-survivors')).toBeTruthy()
    );
  });

  it('renders Open button for members', async () => {
    render(<CirclesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('open-circle-building-confidence')).toBeTruthy()
    );
  });

  it('Join button is disabled when circle is full', async () => {
    render(<CirclesScreen />);
    await waitFor(() => screen.getByTestId('join-circle-newly-out'));
    const btn = screen.getByTestId('join-circle-newly-out');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it('calls joinCircle then navigates to circle-intro on join', async () => {
    render(<CirclesScreen />);
    await waitFor(() => screen.getByTestId('join-circle-family-rejection-survivors'));
    fireEvent.press(screen.getByTestId('join-circle-family-rejection-survivors'));
    await waitFor(() => {
      expect(mockJoin).toHaveBeenCalledWith('circle-1');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/circle-intro',
        params: { circleId: 'circle-1' },
      });
    });
  });

  it('navigates to circle chat when pressing Open on an intro-seen member', async () => {
    render(<CirclesScreen />);
    await waitFor(() => screen.getByTestId('open-circle-building-confidence'));
    fireEvent.press(screen.getByTestId('open-circle-building-confidence'));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/circle',
        params: { circleId: 'circle-3', name: 'Building Confidence' },
      })
    );
  });

  it('shows an empty state when no circles returned', async () => {
    mockList.mockResolvedValue([]);
    render(<CirclesScreen />);
    await waitFor(() =>
      expect(screen.getByText('No circles available right now.')).toBeTruthy()
    );
  });

  it('shows safety note', async () => {
    render(<CirclesScreen />);
    await waitFor(() =>
      expect(screen.getByText(/leave or report/i)).toBeTruthy()
    );
  });
});

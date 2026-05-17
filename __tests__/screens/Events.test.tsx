import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@/services/localResources', () => ({
  getWorkshops: jest.fn(),
  getMeetups: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    profile: { nickname: 'TestUser', country: 'United States' },
  }),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
}));

import EventsScreen from '@/app/events';
import * as service from '@/services/localResources';

const mockGetWorkshops = service.getWorkshops as jest.Mock;
const mockGetMeetups = service.getMeetups as jest.Mock;

const SAMPLE_WORKSHOPS = [
  {
    id: 'ws-1',
    title: 'Coming Out with Confidence',
    description: 'A gentle 4-week online workshop.',
    host: 'HomeWithin Community',
    format: 'online' as const,
    recurring: 'Monthly — first Sunday',
    free: true,
    link: 'https://homewithin.app/workshops/coming-out',
  },
  {
    id: 'ws-2',
    title: 'Healing from Family Rejection',
    description: 'Facilitated peer support sessions.',
    host: 'HomeWithin Community',
    format: 'online' as const,
    recurring: 'Bi-weekly — Saturdays',
    free: true,
  },
];

const SAMPLE_MEETUPS = [
  {
    id: 'mt-us-1',
    title: 'NYC Queer Social',
    description: 'Casual monthly mixer.',
    city: 'New York',
    country: 'United States',
    recurring: 'Monthly — first Friday',
    link: 'https://www.meetup.com/nyc-lgbtq',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetWorkshops.mockReturnValue(SAMPLE_WORKSHOPS);
  mockGetMeetups.mockReturnValue(SAMPLE_MEETUPS);
});

describe('EventsScreen — workshops tab (default)', () => {
  it('shows the screen title', () => {
    render(<EventsScreen />);
    expect(screen.getByText('Events & Circles')).toBeTruthy();
  });

  it('renders workshop cards', () => {
    render(<EventsScreen />);
    expect(screen.getByTestId('workshop-ws-1')).toBeTruthy();
    expect(screen.getByTestId('workshop-ws-2')).toBeTruthy();
  });

  it('shows workshop title and host', () => {
    render(<EventsScreen />);
    expect(screen.getByText('Coming Out with Confidence')).toBeTruthy();
    expect(screen.getAllByText('HomeWithin Community').length).toBeGreaterThan(0);
  });

  it('shows join button when link provided', () => {
    render(<EventsScreen />);
    expect(screen.getByTestId('join-ws-1')).toBeTruthy();
  });

  it('does not show join button when no link', () => {
    render(<EventsScreen />);
    expect(screen.queryByTestId('join-ws-2')).toBeNull();
  });

  it('shows empty state when no workshops', () => {
    mockGetWorkshops.mockReturnValue([]);
    render(<EventsScreen />);
    expect(screen.getByTestId('workshops-empty')).toBeTruthy();
  });
});

describe('EventsScreen — tab switching', () => {
  it('renders tab bar', () => {
    render(<EventsScreen />);
    expect(screen.getByTestId('tab-workshops')).toBeTruthy();
    expect(screen.getByTestId('tab-meetups')).toBeTruthy();
  });

  it('switches to meetups tab', () => {
    render(<EventsScreen />);
    fireEvent.press(screen.getByTestId('tab-meetups'));
    expect(screen.getByTestId('meetup-mt-us-1')).toBeTruthy();
  });

  it('shows meetup title and city', () => {
    render(<EventsScreen />);
    fireEvent.press(screen.getByTestId('tab-meetups'));
    expect(screen.getByText('NYC Queer Social')).toBeTruthy();
    expect(screen.getByText('New York, United States')).toBeTruthy();
  });

  it('shows RSVP button for meetup with link', () => {
    render(<EventsScreen />);
    fireEvent.press(screen.getByTestId('tab-meetups'));
    expect(screen.getByTestId('rsvp-mt-us-1')).toBeTruthy();
  });

  it('shows empty state when no meetups', () => {
    mockGetMeetups.mockReturnValue([]);
    render(<EventsScreen />);
    fireEvent.press(screen.getByTestId('tab-meetups'));
    expect(screen.getByTestId('meetups-empty')).toBeTruthy();
  });
});

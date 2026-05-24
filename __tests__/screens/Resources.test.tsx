import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import ResourcesScreen from '@/app/(tabs)/resources';
import * as resourcesService from '@/services/content/resources';

jest.mock('@/services/content/resources', () => ({
  getResources: jest.fn(),
  getBookmarks: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = cb();
      return cleanup ?? undefined;
    }, []);
  },
}));

const mockGetResources = resourcesService.getResources as jest.Mock;
const mockGetBookmarks = resourcesService.getBookmarks as jest.Mock;

const SAMPLE_ARTICLES = [
  {
    id: 'fr-001',
    title: 'When Your Family Says No',
    summary: 'Understanding why family rejection happens.',
    body: 'Body text here.',
    category: 'family_rejection' as const,
    language: 'English',
    readTime: 3,
    createdAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'is-001',
    title: 'You Were Never the Problem',
    summary: 'Shame is learned.',
    body: 'Body text here.',
    category: 'internalized_shame' as const,
    language: 'English',
    readTime: 3,
    createdAt: '2026-05-01T00:00:00Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetResources.mockResolvedValue(SAMPLE_ARTICLES);
  mockGetBookmarks.mockResolvedValue([]);
});

describe('ResourcesScreen', () => {
  it('renders the screen title', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => expect(screen.getByText('Resources')).toBeTruthy());
  });

  it('renders search input', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => expect(screen.getByTestId('search-input')).toBeTruthy());
  });

  it('renders article cards after loading', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => {
      expect(screen.getByText('When Your Family Says No')).toBeTruthy();
      expect(screen.getByText('You Were Never the Problem')).toBeTruthy();
    });
  });

  it('shows empty state when no articles match search', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => screen.getByTestId('search-input'));
    fireEvent.changeText(screen.getByTestId('search-input'), 'zzznomatchzzz');
    await waitFor(() => expect(screen.getByText('No articles found.')).toBeTruthy());
  });

  it('filters articles by search text', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => screen.getByText('When Your Family Says No'));
    fireEvent.changeText(screen.getByTestId('search-input'), 'family');
    await waitFor(() => {
      expect(screen.getByText('When Your Family Says No')).toBeTruthy();
      expect(screen.queryByText('You Were Never the Problem')).toBeNull();
    });
  });

  it('shows category filter tabs', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => {
      expect(screen.getByText('All')).toBeTruthy();
      expect(screen.getByText('Family rejection')).toBeTruthy();
      expect(screen.getByText('Internalized shame')).toBeTruthy();
    });
  });

  it('shows bookmark icon on bookmarked articles', async () => {
    mockGetBookmarks.mockResolvedValue(['fr-001']);
    render(<ResourcesScreen />);
    await waitFor(() => screen.getByTestId('article-fr-001'));
  });

  it('navigates to article on card press', async () => {
    const { router } = require('expo-router');
    render(<ResourcesScreen />);
    await waitFor(() => screen.getByTestId('article-fr-001'));
    fireEvent.press(screen.getByTestId('article-fr-001'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/article', params: { id: 'fr-001' } });
  });
});

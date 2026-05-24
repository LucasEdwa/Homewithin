import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';

import ArticleScreen from '@/app/(content)/article';
import * as resourcesService from '@/services/content/resources';
import { useLocalSearchParams, router } from 'expo-router';

jest.mock('@/services/content/resources', () => ({
  getResourceById: jest.fn(),
  isBookmarked: jest.fn(),
  toggleBookmark: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

const mockGetById = resourcesService.getResourceById as jest.Mock;
const mockIsBookmarked = resourcesService.isBookmarked as jest.Mock;
const mockToggle = resourcesService.toggleBookmark as jest.Mock;
const mockParams = useLocalSearchParams as jest.Mock;

const SAMPLE_ARTICLE = {
  id: 'fr-001',
  title: 'When Your Family Says No',
  summary: 'Understanding why family rejection happens.',
  body: 'Full article body text goes here for reading.',
  category: 'family_rejection' as const,
  language: 'English',
  readTime: 3,
  createdAt: '2026-05-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({ id: 'fr-001' });
  mockGetById.mockResolvedValue(SAMPLE_ARTICLE);
  mockIsBookmarked.mockResolvedValue(false);
  mockToggle.mockResolvedValue(true);
});

describe('ArticleScreen', () => {
  it('renders article title after loading', async () => {
    render(<ArticleScreen />);
    await waitFor(() => expect(screen.getByText('When Your Family Says No')).toBeTruthy());
  });

  it('renders article summary', async () => {
    render(<ArticleScreen />);
    await waitFor(() => expect(screen.getByText('Understanding why family rejection happens.')).toBeTruthy());
  });

  it('renders article body', async () => {
    render(<ArticleScreen />);
    await waitFor(() => expect(screen.getByText('Full article body text goes here for reading.')).toBeTruthy());
  });

  it('renders read time', async () => {
    render(<ArticleScreen />);
    await waitFor(() => expect(screen.getByText('3 min read')).toBeTruthy());
  });

  it('shows category badge', async () => {
    render(<ArticleScreen />);
    await waitFor(() => expect(screen.getAllByText('Family rejection').length).toBeGreaterThan(0));
  });

  it('shows "Save for later" when not bookmarked', async () => {
    render(<ArticleScreen />);
    await waitFor(() => expect(screen.getByText('Save for later')).toBeTruthy());
  });

  it('shows "Saved" after bookmark toggle', async () => {
    render(<ArticleScreen />);
    await waitFor(() => screen.getByText('Save for later'));
    fireEvent.press(screen.getByText('Save for later'));
    await waitFor(() => expect(screen.getByText('Saved')).toBeTruthy());
    expect(mockToggle).toHaveBeenCalledWith('fr-001');
  });

  it('shows "Saved" when already bookmarked on load', async () => {
    mockIsBookmarked.mockResolvedValue(true);
    mockToggle.mockResolvedValue(false);
    render(<ArticleScreen />);
    await waitFor(() => expect(screen.getByText('Saved')).toBeTruthy());
  });

  it('goes back on back button press', async () => {
    render(<ArticleScreen />);
    await waitFor(() => screen.getByLabelText('Back'));
    fireEvent.press(screen.getByLabelText('Back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('shows not-found state when article is null', async () => {
    mockGetById.mockResolvedValue(null);
    render(<ArticleScreen />);
    await waitFor(() => expect(screen.getByText('Article not found.')).toBeTruthy());
  });

  it('calls Share when share button pressed', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
    render(<ArticleScreen />);
    await waitFor(() => screen.getByLabelText('Share article'));
    fireEvent.press(screen.getByLabelText('Share article'));
    await waitFor(() => expect(Share.share).toHaveBeenCalledWith({
      title: 'When Your Family Says No',
      message: expect.stringContaining('When Your Family Says No'),
    }));
  });
});

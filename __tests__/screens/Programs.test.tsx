import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@/services/content/programs', () => ({
  getAllProgramsWithProgress: jest.fn(),
  getProgramById: jest.fn(),
  getCompletedLessonIds: jest.fn(),
  markLessonComplete: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'prog-001' }),
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = cb();
      return cleanup ?? undefined;
    }, []);
  },
}));

import ProgramsScreen from '@/app/(content)/programs';
import ProgramScreen from '@/app/(content)/program';
import * as programsService from '@/services/content/programs';

const mockGetAll = programsService.getAllProgramsWithProgress as jest.Mock;
const mockGetById = programsService.getProgramById as jest.Mock;
const mockGetCompleted = programsService.getCompletedLessonIds as jest.Mock;
const mockMarkComplete = programsService.markLessonComplete as jest.Mock;

const SAMPLE_PROGRAM = {
  id: 'prog-001',
  title: 'Healing from Parental Rejection',
  description: 'A guided journey through the pain of family rejection.',
  color: '#D9534F',
  icon: 'heart-dislike-outline',
  lessons: [
    {
      id: 'prog-001-l1',
      programId: 'prog-001',
      order: 1,
      title: 'The Weight of Rejection',
      body: 'When a parent rejects their child for being LGBTQ+, the wound runs deep.',
      reflectionPrompt: 'What was the moment you realized your family might not accept you?',
      readTime: 4,
    },
    {
      id: 'prog-001-l2',
      programId: 'prog-001',
      order: 2,
      title: 'Understanding the Rejection',
      body: 'Rejection from a parent is not a reflection of your worth.',
      reflectionPrompt: 'What do you wish your parent understood about you?',
      readTime: 3,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Programs list screen ────────────────────────────────────────────────────

describe('ProgramsScreen', () => {
  it('renders program cards after loading', async () => {
    mockGetAll.mockResolvedValue([
      { ...SAMPLE_PROGRAM, completed: 0, total: 2 },
    ]);
    render(<ProgramsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Healing from Parental Rejection')).toBeTruthy();
    });
  });

  it('shows "Start" CTA for unstarted program', async () => {
    mockGetAll.mockResolvedValue([
      { ...SAMPLE_PROGRAM, completed: 0, total: 2 },
    ]);
    render(<ProgramsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Start')).toBeTruthy();
    });
  });

  it('shows "Continue" CTA for started program', async () => {
    mockGetAll.mockResolvedValue([
      { ...SAMPLE_PROGRAM, completed: 1, total: 2 },
    ]);
    render(<ProgramsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Continue')).toBeTruthy();
    });
  });

  it('shows "Review" CTA for completed program', async () => {
    mockGetAll.mockResolvedValue([
      { ...SAMPLE_PROGRAM, completed: 2, total: 2 },
    ]);
    render(<ProgramsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Review')).toBeTruthy();
    });
  });

  it('navigates to program on card press', async () => {
    const { router } = require('expo-router');
    mockGetAll.mockResolvedValue([
      { ...SAMPLE_PROGRAM, completed: 0, total: 2 },
    ]);
    render(<ProgramsScreen />);
    await waitFor(() => {
      fireEvent.press(screen.getByTestId('program-prog-001'));
    });
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/program' }));
  });
});

// ─── Program detail screen ───────────────────────────────────────────────────

describe('ProgramScreen', () => {
  beforeEach(() => {
    mockGetById.mockResolvedValue(SAMPLE_PROGRAM);
    mockGetCompleted.mockResolvedValue(new Set<string>());
    mockMarkComplete.mockResolvedValue(undefined);
  });

  it('renders program title and description', async () => {
    render(<ProgramScreen />);
    await waitFor(() => {
      expect(screen.getByText('Healing from Parental Rejection')).toBeTruthy();
    });
  });

  it('renders all lessons', async () => {
    render(<ProgramScreen />);
    await waitFor(() => {
      expect(screen.getByText('The Weight of Rejection')).toBeTruthy();
      expect(screen.getByText('Understanding the Rejection')).toBeTruthy();
    });
  });

  it('shows lesson body when expanded (first lesson auto-expands)', async () => {
    render(<ProgramScreen />);
    // First incomplete lesson is auto-expanded
    await waitFor(() => {
      expect(screen.getByText(/wound runs deep/i)).toBeTruthy();
    });
  });

  it('shows progress percentage', async () => {
    render(<ProgramScreen />);
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeTruthy();
    });
  });

  it('shows checkmark for completed lesson', async () => {
    mockGetCompleted.mockResolvedValue(new Set(['prog-001-l1']));
    render(<ProgramScreen />);
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeTruthy();
    });
  });

  it('calls markLessonComplete on button press', async () => {
    render(<ProgramScreen />);
    // Wait for program to load
    await waitFor(() => expect(screen.getByText('Healing from Parental Rejection')).toBeTruthy());
    // First lesson auto-expands — find and press the button
    await waitFor(() => expect(screen.getByTestId('complete-prog-001-l1')).toBeTruthy());
    fireEvent.press(screen.getByTestId('complete-prog-001-l1'));
    expect(mockMarkComplete).toHaveBeenCalledWith('prog-001-l1', 'prog-001');
  });
});

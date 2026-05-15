import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MoodChart } from '@/components/ui/MoodChart';
import type { CheckIn } from '@/types';

function makeCheckIn(date: string, moodScore: number = 4): CheckIn {
  return {
    id: `ci-${date}`,
    date,
    moodScore: moodScore as CheckIn['moodScore'],
    anxietyScore: 3,
    lonelinessScore: 5,
    safetyScore: 8,
    hardestThing: '',
    tags: [],
    createdAt: `${date}T10:00:00Z`,
  };
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

describe('MoodChart', () => {
  it('renders without crashing with empty data', () => {
    render(<MoodChart checkIns={[]} />);
  });

  it('shows "Today" label for the current day', () => {
    render(<MoodChart checkIns={[makeCheckIn(todayISO())]} />);
    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('renders 7 day columns including Today', () => {
    render(<MoodChart checkIns={[]} />);
    const today = screen.getByText('Today');
    expect(today).toBeTruthy();
    // 6 weekday abbreviations + Today = 7 columns total
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rendered = dayLabels.filter((d) => screen.queryByText(d) !== null);
    expect(rendered.length + 1).toBe(7); // +1 for "Today"
  });

  it('renders with multiple check-in entries', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    render(<MoodChart checkIns={[makeCheckIn(todayISO(), 5), makeCheckIn(yesterday, 2)]} />);
    expect(screen.getByText('Today')).toBeTruthy();
  });
});

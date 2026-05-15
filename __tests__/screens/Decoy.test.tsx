import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

const mockSession = {
  locked: false,
  pinEnabled: false,
  disguiseStyle: 'weather' as 'weather' | 'calculator' | 'notes',
};

jest.mock('@/context/SessionContext', () => ({
  useSession: () => mockSession,
}));

import DecoyScreen from '@/app/decoy';
import { router } from 'expo-router';

describe('DecoyScreen — secret gesture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.locked = false;
    mockSession.pinEnabled = false;
    mockSession.disguiseStyle = 'weather';
  });

  it('reveals the app after 5 quick taps within 2s (no PIN)', () => {
    render(<DecoyScreen />);
    const secret = screen.getByTestId('decoy-secret');
    for (let i = 0; i < 5; i++) fireEvent.press(secret);
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('routes to /lock when locked + pinEnabled', () => {
    mockSession.locked = true;
    mockSession.pinEnabled = true;
    render(<DecoyScreen />);
    const secret = screen.getByTestId('decoy-secret');
    for (let i = 0; i < 5; i++) fireEvent.press(secret);
    expect(router.replace).toHaveBeenCalledWith('/lock');
  });

  it('does NOT reveal after only 4 taps', () => {
    render(<DecoyScreen />);
    const secret = screen.getByTestId('decoy-secret');
    for (let i = 0; i < 4; i++) fireEvent.press(secret);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('resets tap counter if taps are slower than 2s window', () => {
    jest.useFakeTimers();
    try {
      const realNow = Date.now;
      let now = 1_000_000;
      Date.now = jest.fn(() => now);

      render(<DecoyScreen />);
      const secret = screen.getByTestId('decoy-secret');
      // 4 quick taps, then a 3s gap, then 1 tap → should only be 1 tap in fresh window.
      for (let i = 0; i < 4; i++) {
        fireEvent.press(secret);
        now += 100;
      }
      now += 3000;
      fireEvent.press(secret);
      expect(router.replace).not.toHaveBeenCalled();

      Date.now = realNow;
    } finally {
      jest.useRealTimers();
    }
  });

  it('renders the calculator style when selected', () => {
    mockSession.disguiseStyle = 'calculator';
    render(<DecoyScreen />);
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('=')).toBeTruthy();
  });

  it('renders the notes style when selected', () => {
    mockSession.disguiseStyle = 'notes';
    render(<DecoyScreen />);
    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Groceries')).toBeTruthy();
  });
});

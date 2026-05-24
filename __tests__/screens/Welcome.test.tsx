import WelcomeScreen from '@/app/(auth)/welcome';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    setProfile: jest.fn().mockResolvedValue(undefined),
    completeOnboarding: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/services/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
  signOut: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/social/matching', () => ({
  syncProfile: jest.fn().mockResolvedValue(undefined),
}));

// expo-router is mocked via __mocks__/expo-router.ts

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WelcomeScreen', () => {
  it('renders the tagline', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('You are safe here.')).toBeTruthy();
  });

  it('renders Start anonymously CTA', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Start anonymously')).toBeTruthy();
  });

  it('renders Sign in CTA', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('renders all four pillars', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Safety')).toBeTruthy();
    expect(screen.getByText('Healing')).toBeTruthy();
    expect(screen.getByText('Connection')).toBeTruthy();
    expect(screen.getByText('Growth')).toBeTruthy();
  });

  it('renders the guest link', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Continue as guest — no account needed')).toBeTruthy();
  });

  it('navigates to onboarding when Start anonymously is pressed', async () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText('Start anonymously'));
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/onboarding/step1');
    });
  });

  it('navigates to sign-in when Sign in is pressed', () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText('Sign in'));
    expect(router.push).toHaveBeenCalledWith('/signin');
  });
});


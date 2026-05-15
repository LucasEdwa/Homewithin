import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import WelcomeScreen from '@/app/welcome';

// expo-router is mocked via __mocks__/expo-router.ts

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WelcomeScreen', () => {
  it('renders the app name', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('HomeWithin')).toBeTruthy();
  });

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

  it('shows the Quick Exit button', () => {
    render(<WelcomeScreen />);
    expect(screen.getByLabelText('Quick exit — close app')).toBeTruthy();
  });

  it('navigates to onboarding when Start anonymously is pressed', () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText('Start anonymously'));
    expect(router.push).toHaveBeenCalledWith('/onboarding/step1');
  });

  it('navigates to sign-in when Sign in is pressed', () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText('Sign in'));
    expect(router.push).toHaveBeenCalledWith('/signin');
  });
});

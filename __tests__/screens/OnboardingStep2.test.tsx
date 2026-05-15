import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import OnboardingStep2 from '@/app/onboarding/step2';
import { renderWithSession } from '../helpers/renderWithSession';

const mockProfile = {
  nickname: 'River',
  pronouns: 'they/them',
  ageRange: '18–24',
  language: 'English',
  country: 'Brazil',
  hideFromSearch: true,
  needs: [],
  isAnonymous: true,
};

beforeEach(() => jest.clearAllMocks());

describe('OnboardingStep2', () => {
  it('renders the title', () => {
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile });
    expect(screen.getByText('What would help most today?')).toBeTruthy();
  });

  it('renders all six need cards', () => {
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile });
    expect(screen.getByText('Emotional safety')).toBeTruthy();
    expect(screen.getByText('Healing')).toBeTruthy();
    expect(screen.getByText('Someone to talk')).toBeTruthy();
    expect(screen.getByText('Find community')).toBeTruthy();
    expect(screen.getByText('Support group')).toBeTruthy();
    expect(screen.getByText('Crisis help')).toBeTruthy();
  });

  it('renders Get started button', () => {
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile });
    expect(screen.getByText('Get started')).toBeTruthy();
  });

  it('renders Skip for now link', () => {
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile });
    expect(screen.getByText('Skip for now')).toBeTruthy();
  });

  it('selecting a need card marks it as checked', () => {
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile });
    const healingCard = screen.getByRole('checkbox', { name: /Healing/i });
    expect(healingCard.props.accessibilityState).toEqual({ checked: false });
    fireEvent.press(healingCard);
    expect(healingCard.props.accessibilityState).toEqual({ checked: true });
  });

  it('can select multiple needs', () => {
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile });
    fireEvent.press(screen.getByRole('checkbox', { name: /Healing/i }));
    fireEvent.press(screen.getByRole('checkbox', { name: /Crisis help/i }));
    expect(screen.getByRole('checkbox', { name: /Healing/i }).props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByRole('checkbox', { name: /Crisis help/i }).props.accessibilityState).toEqual({ checked: true });
  });

  it('deselects a need when tapped again', () => {
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile });
    const card = screen.getByRole('checkbox', { name: /Healing/i });
    fireEvent.press(card);
    fireEvent.press(card);
    expect(card.props.accessibilityState).toEqual({ checked: false });
  });

  it('calls setProfile and completeOnboarding on Get started', async () => {
    const setProfile = jest.fn().mockResolvedValue(undefined);
    const completeOnboarding = jest.fn().mockResolvedValue(undefined);
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile, setProfile, completeOnboarding });

    fireEvent.press(screen.getByRole('checkbox', { name: /Healing/i }));
    fireEvent.press(screen.getByText('Get started'));

    await waitFor(() => {
      expect(setProfile).toHaveBeenCalledWith(expect.objectContaining({
        needs: ['healing'],
      }));
      expect(completeOnboarding).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/safety');
    });
  });

  it('skip navigates to safety without selecting needs', async () => {
    const completeOnboarding = jest.fn().mockResolvedValue(undefined);
    renderWithSession(<OnboardingStep2 />, { profile: mockProfile, completeOnboarding });

    fireEvent.press(screen.getByText('Skip for now'));

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/safety');
    });
  });
});

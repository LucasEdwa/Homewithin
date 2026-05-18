import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import OnboardingStep1 from '@/app/onboarding/step1';
import { renderWithSession } from '../helpers/renderWithSession';

beforeEach(() => jest.clearAllMocks());

describe('OnboardingStep1', () => {
  it('renders the title', () => {
    renderWithSession(<OnboardingStep1 />);
    expect(screen.getByText('Tell us a little about you')).toBeTruthy();
  });

  it('renders the Nickname input', () => {
    renderWithSession(<OnboardingStep1 />);
    expect(screen.getByPlaceholderText('e.g. River, Sage, Alex')).toBeTruthy();
  });

  it('renders the background input', () => {
    renderWithSession(<OnboardingStep1 />);
    expect(screen.getByPlaceholderText('e.g. Sweden, Brazil, Syria, Somalia…')).toBeTruthy();
  });

  it('renders pronoun options', () => {
    renderWithSession(<OnboardingStep1 />);
    expect(screen.getByText('he/him')).toBeTruthy();
    expect(screen.getByText('she/her')).toBeTruthy();
    expect(screen.getByText('they/them')).toBeTruthy();
  });

  it('renders all age range options', () => {
    renderWithSession(<OnboardingStep1 />);
    expect(screen.getByText('Under 18')).toBeTruthy();
    expect(screen.getByText('18–24')).toBeTruthy();
    expect(screen.getByText('25–34')).toBeTruthy();
  });

  it('renders Hide from search toggle', () => {
    renderWithSession(<OnboardingStep1 />);
    expect(screen.getByLabelText('Hide profile from search')).toBeTruthy();
  });

  it('shows validation error when continuing without nickname', async () => {
    renderWithSession(<OnboardingStep1 />);
    fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText('Please choose a nickname.')).toBeTruthy();
    });
  });

  it('shows validation error when background is missing', async () => {
    renderWithSession(<OnboardingStep1 />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. River, Sage, Alex'), 'River');
    fireEvent.press(screen.getByText('18–24'));
    fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText('Please enter your background.')).toBeTruthy();
    });
  });

  it('navigates to step2 after valid submission', async () => {
    const setProfile = jest.fn().mockResolvedValue(undefined);
    renderWithSession(<OnboardingStep1 />, { setProfile });

    fireEvent.changeText(screen.getByPlaceholderText('e.g. River, Sage, Alex'), 'River');
    fireEvent.press(screen.getByText('18–24'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Sweden, Brazil, Syria, Somalia…'), 'Brazil');
    fireEvent.press(screen.getByText('Continue'));

    await waitFor(() => {
      expect(setProfile).toHaveBeenCalledWith(expect.objectContaining({
        nickname: 'River',
        ageRange: '18–24',
        country: 'Brazil',
        isAnonymous: true,
      }));
      expect(router.push).toHaveBeenCalledWith('/onboarding/step2');
    });
  });
});

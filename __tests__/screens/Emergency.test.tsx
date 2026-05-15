import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import EmergencyScreen from '@/app/emergency';
import { renderWithSession } from '../helpers/renderWithSession';

const mockProfile = {
  nickname: 'River',
  pronouns: 'they/them',
  ageRange: '18–24',
  language: 'English',
  country: 'United States',
  hideFromSearch: true,
  needs: [],
  isAnonymous: true,
};

beforeEach(() => jest.clearAllMocks());

describe('EmergencyScreen', () => {
  it('renders the header title', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByText('Emergency Support')).toBeTruthy();
  });

  it('renders the support message', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByText('You are not alone. Help is available right now.')).toBeTruthy();
  });

  it('renders all four action cards', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByLabelText(/Call support/i)).toBeTruthy();
    expect(screen.getByLabelText(/Safety plan/i)).toBeTruthy();
    expect(screen.getByLabelText(/Quick hide/i)).toBeTruthy();
    expect(screen.getByLabelText(/Delete data/i)).toBeTruthy();
  });

  it('renders Quick Exit button in header', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByLabelText('Quick exit')).toBeTruthy();
  });

  it('renders the one-tap exit button', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByText('One-tap exit')).toBeTruthy();
  });

  it('renders crisis hotlines section title', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByText('Crisis hotlines')).toBeTruthy();
  });

  it('shows US hotlines when profile country is United States', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByText('United States')).toBeTruthy();
    expect(screen.getByText('Trevor Project (LGBTQ+)')).toBeTruthy();
  });

  it('close button calls router.back', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByLabelText('Close emergency screen'));
    expect(router.back).toHaveBeenCalled();
  });

  it('Quick hide navigates to decoy screen', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByLabelText(/Quick hide/i));
    expect(router.replace).toHaveBeenCalledWith('/decoy');
  });

  it('Call support action expands hotlines list', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByLabelText(/Call support/i));
    // After pressing, "Show all countries" should appear (because showHotlines was false)
    // Actually showHotlines is set to true, so all hotlines show — "Show all countries" disappears
    expect(screen.queryByText('Show all countries →')).toBeNull();
  });
});

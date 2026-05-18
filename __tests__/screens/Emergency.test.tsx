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
    expect(screen.getByLabelText(/Local help/i)).toBeTruthy();
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

  it('renders the hide app guide section', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByText('Hide app guide')).toBeTruthy();
  });

  it('renders hide guide instructions', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    expect(screen.getByText(/Profile › Privacy/)).toBeTruthy();
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

  it('Local help navigates to local resources screen', () => {
    renderWithSession(<EmergencyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByLabelText(/Local help/i));
    expect(router.push).toHaveBeenCalledWith('/local-resources');
  });
});

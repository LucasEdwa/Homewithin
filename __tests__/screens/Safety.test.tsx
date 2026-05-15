import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import SafetyScreen from '@/app/safety';
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

describe('SafetyScreen — initial state', () => {
  it('renders the title', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    expect(screen.getByText('How are you feeling right now?')).toBeTruthy();
  });

  it('renders the Check my safety button', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    expect(screen.getByText('Check my safety')).toBeTruthy();
  });

  it('renders the mood slider label', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    expect(screen.getByText('How safe do you feel right now?')).toBeTruthy();
  });

  it('renders all four question cards', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    expect(screen.getByText('I currently live with family')).toBeTruthy();
    expect(screen.getByText('Someone might check my phone')).toBeTruthy();
    expect(screen.getByText('I feel in danger right now')).toBeTruthy();
    expect(screen.getByText('I have a trusted person I can contact')).toBeTruthy();
  });

  it('question cards are unchecked by default', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    const card = screen.getByRole('checkbox', { name: /I feel in danger right now/i });
    expect(card.props.accessibilityState).toEqual({ checked: false });
  });

  it('toggling a question card checks it', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    const card = screen.getByRole('checkbox', { name: /I feel in danger right now/i });
    fireEvent.press(card);
    expect(card.props.accessibilityState).toEqual({ checked: true });
  });
});

describe('SafetyScreen — after assessment', () => {
  it('shows green state when mood is high and no risk', async () => {
    const setSafetyLevel = jest.fn();
    renderWithSession(<SafetyScreen />, { profile: mockProfile, setSafetyLevel });
    fireEvent.press(screen.getByText('Check my safety'));
    await waitFor(() => {
      expect(screen.getByText('You seem safe.')).toBeTruthy();
    });
  });

  it('calls setSafetyLevel with green', async () => {
    const setSafetyLevel = jest.fn();
    renderWithSession(<SafetyScreen />, { profile: mockProfile, setSafetyLevel });
    fireEvent.press(screen.getByText('Check my safety'));
    await waitFor(() => {
      expect(setSafetyLevel).toHaveBeenCalledWith('green');
    });
  });

  it('shows red state when in danger is selected', async () => {
    const setSafetyLevel = jest.fn();
    renderWithSession(<SafetyScreen />, { profile: mockProfile, setSafetyLevel });
    fireEvent.press(screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    fireEvent.press(screen.getByText('Check my safety'));
    await waitFor(() => {
      expect(screen.getByText('You may need immediate support.')).toBeTruthy();
    });
  });

  it('calls setSafetyLevel with red when in danger', async () => {
    const setSafetyLevel = jest.fn();
    renderWithSession(<SafetyScreen />, { profile: mockProfile, setSafetyLevel });
    fireEvent.press(screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    fireEvent.press(screen.getByText('Check my safety'));
    await waitFor(() => {
      expect(setSafetyLevel).toHaveBeenCalledWith('red');
    });
  });

  it('shows safety plan section after assessment', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Check my safety'));
    await waitFor(() => {
      expect(screen.getByText('Create a safety plan')).toBeTruthy();
    });
  });

  it('shows Go to home button after assessment', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Check my safety'));
    await waitFor(() => {
      expect(screen.getByText('Go to home')).toBeTruthy();
    });
  });

  it('Go to home navigates to tabs', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Check my safety'));
    await waitFor(() => screen.getByText('Go to home'));
    fireEvent.press(screen.getByText('Go to home'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('hides Check my safety button after assessment', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Check my safety'));
    await waitFor(() => {
      expect(screen.queryByText('Check my safety')).toBeNull();
    });
  });
});

import SafetyScreen from '@/app/(wellness)/safety';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { renderWithSession } from '../helpers/renderWithSession';

import * as localResourcesService from '@/services/content/localResources';

jest.mock('@/services/content/localResources', () => ({
  requestLocationPermission: jest.fn(),
  getResources: jest.fn(),
}));
const mockRequestLocation = localResourcesService.requestLocationPermission as jest.Mock;
const mockGetResources = localResourcesService.getResources as jest.Mock;

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

beforeEach(() => {
  jest.clearAllMocks();
  mockRequestLocation.mockResolvedValue({ granted: false });
  mockGetResources.mockReturnValue([]);
});

// Helper: press "Begin" then navigate through all 6 steps to reach results.
// Each step requires 2 presses (first triggers skip notice, second advances).
async function completeAllSteps() {
  fireEvent.press(screen.getByText('Begin'));
  for (let step = 1; step <= 5; step++) {
    await waitFor(() => expect(screen.getByText('Next')).toBeTruthy());
    fireEvent.press(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Next')).toBeTruthy());
    fireEvent.press(screen.getByText('Next'));
  }
  await waitFor(() => expect(screen.getByText('See my results')).toBeTruthy());
  fireEvent.press(screen.getByText('See my results'));
  await waitFor(() => expect(screen.getByText('See my results')).toBeTruthy());
  fireEvent.press(screen.getByText('See my results'));
}

describe('SafetyScreen — intro', () => {
  it('renders the intro title', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    expect(screen.getByText('Safety check-in')).toBeTruthy();
  });

  it('renders the Begin button', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    expect(screen.getByText('Begin')).toBeTruthy();
  });

  it('renders a preview of all 6 steps', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    expect(screen.getByText('Right now')).toBeTruthy();
    expect(screen.getByText('Home & body')).toBeTruthy();
    expect(screen.getByText('Identity & pressure')).toBeTruthy();
    expect(screen.getByText('School & community')).toBeTruthy();
    expect(screen.getByText('Your mind')).toBeTruthy();
    expect(screen.getByText('Your resources')).toBeTruthy();
  });

  it('navigates to tabs when Skip for now is pressed', () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Skip for now'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });
});

describe('SafetyScreen — step navigation', () => {
  it('shows step 1 after pressing Begin', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => {
      expect(screen.getByText('Right now')).toBeTruthy();
      expect(screen.getByText('How safe do you feel right now?')).toBeTruthy();
    });
  });

  it('shows step 2 after pressing Next on step 1', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => screen.getByText('Next'));
    fireEvent.press(screen.getByText('Next')); // triggers skip notice
    await waitFor(() => screen.getByText('Next'));
    fireEvent.press(screen.getByText('Next')); // advances to step 2
    await waitFor(() => {
      expect(screen.getByText('Home & body')).toBeTruthy();
    });
  });

  it('shows the danger question on step 1', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /I feel in danger right now/i })).toBeTruthy();
    });
  });

  it('question cards are unchecked by default', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => {
      const card = screen.getByRole('checkbox', { name: /I feel in danger right now/i });
      expect(card.props.accessibilityState).toEqual({ checked: false });
    });
  });

  it('toggling a question card checks it', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    const card = screen.getByRole('checkbox', { name: /I feel in danger right now/i });
    fireEvent.press(card);
    expect(card.props.accessibilityState).toEqual({ checked: true });
  });

  it('shows progress label during steps', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => {
      expect(screen.getByText('1/6')).toBeTruthy();
    });
  });
});

describe('SafetyScreen — crisis interrupt', () => {
  it('shows crisis resources immediately when "in danger" is checked', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    fireEvent.press(screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    await waitFor(() => {
      expect(screen.getByText("You don't have to carry this alone.")).toBeTruthy();
    });
  });

  it('hides crisis interrupt when danger is unchecked again', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    const card = screen.getByRole('checkbox', { name: /I feel in danger right now/i });
    fireEvent.press(card); // check
    fireEvent.press(card); // uncheck
    await waitFor(() => {
      expect(screen.queryByText("You don't have to carry this alone.")).toBeNull();
    });
  });
});

describe('SafetyScreen — results', () => {
  it('shows green state when completing with no risk factors and high mood', async () => {
    const setSafetyLevel = jest.fn();
    renderWithSession(<SafetyScreen />, { profile: mockProfile, setSafetyLevel });
    await completeAllSteps();
    await waitFor(() => {
      expect(screen.getByText('You seem to be in a safe place.')).toBeTruthy();
    });
  });

  it('calls setSafetyLevel with green on clean completion', async () => {
    const setSafetyLevel = jest.fn();
    renderWithSession(<SafetyScreen />, { profile: mockProfile, setSafetyLevel });
    await completeAllSteps();
    await waitFor(() => {
      expect(setSafetyLevel).toHaveBeenCalledWith('green');
    });
  });

  it('returns red when currently_in_danger is selected', async () => {
    const setSafetyLevel = jest.fn();
    renderWithSession(<SafetyScreen />, { profile: mockProfile, setSafetyLevel });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    fireEvent.press(screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    // Step 1 → step 2: 1 press (already interacted via checkbox)
    await waitFor(() => expect(screen.getByText('Next')).toBeTruthy());
    fireEvent.press(screen.getByText('Next'));
    // Steps 2–5: 2 presses each
    for (let i = 0; i < 4; i++) {
      await waitFor(() => expect(screen.getByText('Next')).toBeTruthy());
      fireEvent.press(screen.getByText('Next'));
      await waitFor(() => expect(screen.getByText('Next')).toBeTruthy());
      fireEvent.press(screen.getByText('Next'));
    }
    // Step 6: 2 presses of "See my results"
    await waitFor(() => expect(screen.getByText('See my results')).toBeTruthy());
    fireEvent.press(screen.getByText('See my results'));
    await waitFor(() => expect(screen.getByText('See my results')).toBeTruthy());
    fireEvent.press(screen.getByText('See my results'));
    await waitFor(() => {
      expect(setSafetyLevel).toHaveBeenCalledWith('red');
    });
  });

  it('shows red result state text when in danger', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    fireEvent.press(screen.getByText('Begin'));
    await waitFor(() => screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    fireEvent.press(screen.getByRole('checkbox', { name: /I feel in danger right now/i }));
    // Step 1 → step 2: 1 press (already interacted via checkbox)
    await waitFor(() => expect(screen.getByText('Next')).toBeTruthy());
    fireEvent.press(screen.getByText('Next'));
    // Steps 2–5: 2 presses each
    for (let i = 0; i < 4; i++) {
      await waitFor(() => expect(screen.getByText('Next')).toBeTruthy());
      fireEvent.press(screen.getByText('Next'));
      await waitFor(() => expect(screen.getByText('Next')).toBeTruthy());
      fireEvent.press(screen.getByText('Next'));
    }
    // Step 6: 2 presses of "See my results"
    await waitFor(() => expect(screen.getByText('See my results')).toBeTruthy());
    fireEvent.press(screen.getByText('See my results'));
    await waitFor(() => expect(screen.getByText('See my results')).toBeTruthy());
    fireEvent.press(screen.getByText('See my results'));
    await waitFor(() => {
      expect(screen.getByText('You need support right now.')).toBeTruthy();
    });
  });

  it('shows safety plan after completing assessment', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    await completeAllSteps();
    await waitFor(() => {
      expect(screen.getByText('Your safety plan')).toBeTruthy();
    });
  });

  it('shows Go to home button after completing assessment', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    await completeAllSteps();
    await waitFor(() => {
      expect(screen.getByText('Go to home')).toBeTruthy();
    });
  });

  it('Go to home navigates to tabs', async () => {
    renderWithSession(<SafetyScreen />, { profile: mockProfile });
    await completeAllSteps();
    await waitFor(() => screen.getByText('Go to home'));
    fireEvent.press(screen.getByText('Go to home'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });
});

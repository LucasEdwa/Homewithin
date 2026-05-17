import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@/services/chosenFamily', () => ({
  getSupportPeople: jest.fn(),
  addSupportPerson: jest.fn(),
  updateSupportPerson: jest.fn(),
  removeSupportPerson: jest.fn(),
  getNextSuggestedRole: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = cb();
      return cleanup ?? undefined;
    }, []);
  },
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn().mockResolvedValue(true),
  openURL: jest.fn(),
}));

import ChosenFamilyScreen from '@/app/chosen-family';
import * as cfService from '@/services/chosenFamily';
import { SUPPORT_ROLES } from '@/types';

const mockGetPeople = cfService.getSupportPeople as jest.Mock;
const mockAdd = cfService.addSupportPerson as jest.Mock;
const mockUpdate = cfService.updateSupportPerson as jest.Mock;
const mockRemove = cfService.removeSupportPerson as jest.Mock;
const mockNextRole = cfService.getNextSuggestedRole as jest.Mock;

const SAMPLE_PERSON = {
  id: 'p1',
  nickname: 'Alex',
  role: 'trusted_friend' as const,
  contactInfo: '+1234567890',
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPeople.mockResolvedValue([]);
  mockNextRole.mockReturnValue(SUPPORT_ROLES[0]);
  mockAdd.mockResolvedValue(SAMPLE_PERSON);
  mockUpdate.mockResolvedValue(undefined);
  mockRemove.mockResolvedValue(undefined);
});

describe('ChosenFamilyScreen', () => {
  it('renders the hub and "You" label', async () => {
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.getByText('You')).toBeTruthy();
    });
  });

  it('shows "0 of 5 roles filled" when empty', async () => {
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.getByText('Start building your support network')).toBeTruthy();
    });
  });

  it('renders all 5 role cards', async () => {
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('role-card-trusted_friend')).toBeTruthy();
      expect(screen.getByTestId('role-card-mentor')).toBeTruthy();
      expect(screen.getByTestId('role-card-therapist')).toBeTruthy();
      expect(screen.getByTestId('role-card-emergency_contact')).toBeTruthy();
      expect(screen.getByTestId('role-card-community_group')).toBeTruthy();
    });
  });

  it('shows next step suggestion for first empty role', async () => {
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.getByText('Next step')).toBeTruthy();
    });
  });

  it('hides suggestion when all roles filled', async () => {
    mockNextRole.mockReturnValue(null);
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.queryByText('Next step')).toBeNull();
    });
  });

  it('shows person name when role is filled', async () => {
    mockGetPeople.mockResolvedValue([SAMPLE_PERSON]);
    mockNextRole.mockReturnValue(SUPPORT_ROLES[1]);
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeTruthy();
    });
  });

  it('shows filled count when people added', async () => {
    mockGetPeople.mockResolvedValue([SAMPLE_PERSON]);
    mockNextRole.mockReturnValue(SUPPORT_ROLES[1]);
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.getByText('1 of 5 roles filled')).toBeTruthy();
    });
  });

  it('opens add modal when empty role card is pressed', async () => {
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      fireEvent.press(screen.getByTestId('role-card-trusted_friend'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('cf-nickname-input')).toBeTruthy();
    });
  });

  it('opens add modal from suggestion button', async () => {
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      fireEvent.press(screen.getByTestId('suggestion-add-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('cf-nickname-input')).toBeTruthy();
    });
  });

  it('calls addSupportPerson with form data', async () => {
    mockGetPeople
      .mockResolvedValueOnce([])
      .mockResolvedValue([SAMPLE_PERSON]);

    render(<ChosenFamilyScreen />);
    await waitFor(() => fireEvent.press(screen.getByTestId('role-card-trusted_friend')));
    await waitFor(() => expect(screen.getByTestId('cf-nickname-input')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('cf-nickname-input'), 'Alex');
    fireEvent.changeText(screen.getByTestId('cf-contact-input'), '+1234567890');
    fireEvent.press(screen.getByTestId('cf-save-btn'));

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: 'Alex', role: 'trusted_friend' })
      );
    });
  });

  it('shows contact button for person with phone/sms', async () => {
    mockGetPeople.mockResolvedValue([SAMPLE_PERSON]);
    mockNextRole.mockReturnValue(SUPPORT_ROLES[1]);
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('contact-btn-trusted_friend')).toBeTruthy();
    });
  });

  it('shows remove button for filled role', async () => {
    mockGetPeople.mockResolvedValue([SAMPLE_PERSON]);
    mockNextRole.mockReturnValue(SUPPORT_ROLES[1]);
    render(<ChosenFamilyScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('remove-btn-trusted_friend')).toBeTruthy();
    });
  });
});

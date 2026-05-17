import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/services/localResources', () => ({
  getResources: jest.fn(),
  requestLocationPermission: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    profile: {
      nickname: 'TestUser',
      country: 'Stockholm',
    },
  }),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
}));

import LocalResourcesScreen from '@/app/local-resources';
import * as service from '@/services/localResources';

const mockGetResources = service.getResources as jest.Mock;
const mockRequestLocation = service.requestLocationPermission as jest.Mock;

const SAMPLE_RESOURCES = [
  {
    id: 'br-lgbtq-1',
    name: 'ABGLT',
    type: 'lgbtq_center' as const,
    description: 'Maior organização LGBT+ do Brasil.',
    country: 'Brazil',
    website: 'https://www.abglt.org',
    phone: '+55 61 3321-6969',
  },
  {
    id: 'br-shelter-1',
    name: 'Casa 1',
    type: 'shelter' as const,
    description: 'Casa de acolhimento em São Paulo.',
    country: 'Brazil',
    city: 'São Paulo',
    website: 'https://www.casaum.org',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetResources.mockReturnValue(SAMPLE_RESOURCES);
  mockRequestLocation.mockResolvedValue({ granted: false });
});

describe('LocalResourcesScreen — rendering', () => {
  it('shows screen title', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByText('Local Resources')).toBeTruthy();
  });

  it('renders resource cards', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByTestId('resource-br-lgbtq-1')).toBeTruthy();
    expect(screen.getByTestId('resource-br-shelter-1')).toBeTruthy();
  });

  it('shows resource name and description', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByText('ABGLT')).toBeTruthy();
    expect(screen.getByText('Casa 1')).toBeTruthy();
  });

  it('shows website button when resource has website', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByTestId('website-br-lgbtq-1')).toBeTruthy();
  });

  it('shows phone button when resource has phone', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByTestId('phone-br-lgbtq-1')).toBeTruthy();
  });

  it('shows empty state when no resources', () => {
    mockGetResources.mockReturnValue([]);
    render(<LocalResourcesScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });
});

describe('LocalResourcesScreen — country picker', () => {
  it('shows Stockholm as default county (from profile)', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByText('Stockholm')).toBeTruthy();
  });

  it('toggles county dropdown on press', () => {
    render(<LocalResourcesScreen />);
    const picker = screen.getByTestId('country-picker');
    fireEvent.press(picker);
    expect(screen.getByTestId('country-Uppsala')).toBeTruthy();
  });

  it('selects a different county', () => {
    render(<LocalResourcesScreen />);
    fireEvent.press(screen.getByTestId('country-picker'));
    fireEvent.press(screen.getByTestId('country-Skåne'));
    expect(mockGetResources).toHaveBeenCalledWith('Skåne', undefined);
  });
});

describe('LocalResourcesScreen — type filters', () => {
  it('renders type filter chips', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByTestId('filter-all')).toBeTruthy();
    expect(screen.getByTestId('filter-lgbtq_center')).toBeTruthy();
    expect(screen.getByTestId('filter-shelter')).toBeTruthy();
    expect(screen.getByTestId('filter-therapist')).toBeTruthy();
    expect(screen.getByTestId('filter-legal_aid')).toBeTruthy();
    expect(screen.getByTestId('filter-support_group')).toBeTruthy();
  });

  it('calls getResources with type when filter pressed', () => {
    render(<LocalResourcesScreen />);
    fireEvent.press(screen.getByTestId('filter-shelter'));
    expect(mockGetResources).toHaveBeenCalledWith('Stockholm', 'shelter');
  });

  it('clears type filter when All pressed', () => {
    render(<LocalResourcesScreen />);
    fireEvent.press(screen.getByTestId('filter-shelter'));
    fireEvent.press(screen.getByTestId('filter-all'));
    expect(mockGetResources).toHaveBeenLastCalledWith('Stockholm', undefined);
  });
});

describe('LocalResourcesScreen — location', () => {
  it('requests location permission on location button press', async () => {
    render(<LocalResourcesScreen />);
    fireEvent.press(screen.getByTestId('location-btn'));
    await waitFor(() => expect(mockRequestLocation).toHaveBeenCalled());
  });
});

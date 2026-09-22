import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import LocalResourcesScreen from '@/app/(content)/local-resources';
import * as service from '@/services/content/localResources';

jest.mock('@/services/content/localResources', () => ({
  getResources: jest.fn(),
  requestLocationPermission: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    nearbyState: 'Stockholm',
    profile: { nickname: 'TestUser', country: 'Brazil' },
  }),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
}));

const mockGetResources = service.getResources as jest.Mock;
const mockRequestLocation = service.requestLocationPermission as jest.Mock;

const SAMPLE_RESOURCES = [
  {
    id: 'se-sthlm-1',
    name: 'RFSL Stockholm',
    type: 'lgbtq_center' as const,
    description: 'HBTQ+-förening i Stockholm.',
    state: 'Stockholm',
    website: 'https://www.rfslstockholm.com',
    phone: '08-501 62 900',
  },
  {
    id: 'se-nat-3',
    name: 'Mind – Självmordslinjen',
    type: 'support_group' as const,
    description: 'Krisstöd dygnet runt.',
    state: 'Sweden',
    website: 'https://mind.se',
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
    expect(screen.getByTestId('resource-se-sthlm-1')).toBeTruthy();
    expect(screen.getByTestId('resource-se-nat-3')).toBeTruthy();
  });

  it('shows resource name and description', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByText('RFSL Stockholm')).toBeTruthy();
    expect(screen.getByText('Mind – Självmordslinjen')).toBeTruthy();
  });

  it('shows website button when resource has website', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByTestId('website-se-sthlm-1')).toBeTruthy();
  });

  it('shows phone button when resource has phone', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByTestId('phone-se-sthlm-1')).toBeTruthy();
  });

  it('shows empty state when no resources', () => {
    mockGetResources.mockReturnValue([]);
    render(<LocalResourcesScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });
});

describe('LocalResourcesScreen — state picker', () => {
  it('shows Stockholm as default state (from profile)', () => {
    render(<LocalResourcesScreen />);
    expect(screen.getByText('Stockholm')).toBeTruthy();
  });

  it('toggles state dropdown on press', () => {
    render(<LocalResourcesScreen />);
    fireEvent.press(screen.getByTestId('state-picker'));
    expect(screen.getByTestId('state-Blekinge')).toBeTruthy();
  });

  it('selects a different state', () => {
    render(<LocalResourcesScreen />);
    fireEvent.press(screen.getByTestId('state-picker'));
    fireEvent.press(screen.getByTestId('state-Uppsala'));
    expect(mockGetResources).toHaveBeenCalledWith('Uppsala', undefined);
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

describe('LocalResourcesScreen — search', () => {
  it('filters resources by name', () => {
    render(<LocalResourcesScreen />);
    fireEvent.changeText(screen.getByTestId('local-resources-search-input'), 'RFSL');
    expect(screen.getByTestId('resource-se-sthlm-1')).toBeTruthy();
    expect(screen.queryByTestId('resource-se-nat-3')).toBeNull();
  });

  it('filters resources by description text, case-insensitively', () => {
    render(<LocalResourcesScreen />);
    fireEvent.changeText(screen.getByTestId('local-resources-search-input'), 'krisstöd');
    expect(screen.getByTestId('resource-se-nat-3')).toBeTruthy();
    expect(screen.queryByTestId('resource-se-sthlm-1')).toBeNull();
  });

  it('shows the empty state when nothing matches the search', () => {
    render(<LocalResourcesScreen />);
    fireEvent.changeText(screen.getByTestId('local-resources-search-input'), 'nonexistent org');
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('clears the search and restores the full list', () => {
    render(<LocalResourcesScreen />);
    const input = screen.getByTestId('local-resources-search-input');
    fireEvent.changeText(input, 'RFSL');
    expect(screen.queryByTestId('resource-se-nat-3')).toBeNull();
    fireEvent.changeText(input, '');
    expect(screen.getByTestId('resource-se-nat-3')).toBeTruthy();
  });
});

import type { SafetyLevel, UserProfile } from '@/context/SessionContext';
import { SessionContext } from '@/context/SessionContext';
import type { LocalResource } from '@/types';
import { render } from '@testing-library/react-native';
import React from 'react';

interface MockSession {
  profile?: UserProfile | null;
  safetyLevel?: SafetyLevel;
  onboardingComplete?: boolean;
  loading?: boolean;
  nearbyState?: string | null;
  nearbyResources?: LocalResource[];
  setProfile?: jest.Mock;
  setSafetyLevel?: jest.Mock;
  completeOnboarding?: jest.Mock;
  reset?: jest.Mock;
  refreshLocation?: jest.Mock;
}

export function renderWithSession(ui: React.ReactElement, session: MockSession = {}) {
  const defaultSession = {
    profile: null,
    safetyLevel: null,
    onboardingComplete: false,
    loading: false,
    nearbyState: null,
    nearbyResources: [],
    setProfile: jest.fn().mockResolvedValue(undefined),
    setSafetyLevel: jest.fn(),
    completeOnboarding: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
    refreshLocation: jest.fn().mockResolvedValue(undefined),
    ...session,
  };

  return render(
    <SessionContext.Provider value={defaultSession as any}>
      {ui}
    </SessionContext.Provider>
  );
}

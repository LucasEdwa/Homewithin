import React from 'react';
import { render } from '@testing-library/react-native';
import { SessionContext } from '@/context/SessionContext';
import type { UserProfile, SafetyLevel } from '@/context/SessionContext';

interface MockSession {
  profile?: UserProfile | null;
  safetyLevel?: SafetyLevel;
  onboardingComplete?: boolean;
  loading?: boolean;
  setProfile?: jest.Mock;
  setSafetyLevel?: jest.Mock;
  completeOnboarding?: jest.Mock;
  reset?: jest.Mock;
}

export function renderWithSession(ui: React.ReactElement, session: MockSession = {}) {
  const defaultSession = {
    profile: null,
    safetyLevel: null,
    onboardingComplete: false,
    loading: false,
    setProfile: jest.fn().mockResolvedValue(undefined),
    setSafetyLevel: jest.fn(),
    completeOnboarding: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
    ...session,
  };

  return render(
    <SessionContext.Provider value={defaultSession as any}>
      {ui}
    </SessionContext.Provider>
  );
}

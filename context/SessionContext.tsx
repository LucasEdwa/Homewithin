import React, { createContext, useContext, useEffect, useState } from 'react';
import { markOnboardingComplete, isOnboardingComplete, saveSession, getSession } from '@/services/storage';

export interface UserProfile {
  nickname: string;
  pronouns: string;
  ageRange: string;
  language: string;
  country: string;
  hideFromSearch: boolean;
  needs: string[];
  isAnonymous: boolean;
}

export type SafetyLevel = 'green' | 'yellow' | 'red' | null;

interface SessionState {
  profile: UserProfile | null;
  safetyLevel: SafetyLevel;
  onboardingComplete: boolean;
  loading: boolean;
}

interface SessionContextValue extends SessionState {
  setProfile: (profile: UserProfile) => Promise<void>;
  setSafetyLevel: (level: SafetyLevel) => void;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    profile: null,
    safetyLevel: null,
    onboardingComplete: false,
    loading: true,
  });

  useEffect(() => {
    async function init() {
      const [complete, session] = await Promise.all([
        isOnboardingComplete(),
        getSession(),
      ]);
      setState((s) => ({
        ...s,
        onboardingComplete: complete,
        profile: session as UserProfile | null,
        loading: false,
      }));
    }
    init();
  }, []);

  async function setProfile(profile: UserProfile) {
    await saveSession(profile);
    setState((s) => ({ ...s, profile }));
  }

  function setSafetyLevel(safetyLevel: SafetyLevel) {
    setState((s) => ({ ...s, safetyLevel }));
  }

  async function completeOnboarding() {
    await markOnboardingComplete();
    setState((s) => ({ ...s, onboardingComplete: true }));
  }

  function reset() {
    setState({ profile: null, safetyLevel: null, onboardingComplete: false, loading: false });
  }

  return (
    <SessionContext.Provider value={{ ...state, setProfile, setSafetyLevel, completeOnboarding, reset }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

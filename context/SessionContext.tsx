// Aggregated session context. All state lives in the four focused sub-contexts;
// SessionBridge reads them and publishes a single SessionContext value so that:
//   - production code calls useSession() unchanged
//   - test helpers can still use <SessionContext.Provider value={mock}> directly
import React, { createContext, useContext } from 'react';
import { AuthProvider, useAuth, type UserProfile } from './AuthContext';
import { LocationProvider, useLocation } from './LocationContext';
import { SafetyProvider, useSafety, type SafetyLevel } from './SafetyContext';
import { SecurityProvider, useSecurity } from './SecurityContext';
import type { DisguiseStyle } from '@/types/user';
import type { LocalResource } from '@/types';

export type { SafetyLevel, UserProfile };

interface SessionContextValue {
  profile: UserProfile | null;
  onboardingComplete: boolean;
  loading: boolean;
  safetyLevel: SafetyLevel;
  pinEnabled: boolean;
  locked: boolean;
  disguiseEnabled: boolean;
  disguiseStyle: DisguiseStyle;
  nearbyState: string | null;
  nearbyResources: LocalResource[];
  setProfile: (profile: UserProfile) => Promise<void>;
  setSafetyLevel: (level: SafetyLevel) => void;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
  setPinEnabled: (enabled: boolean) => void;
  unlock: () => void;
  lock: () => void;
  setDisguiseEnabled: (enabled: boolean) => Promise<void>;
  setDisguiseStyle: (style: DisguiseStyle) => Promise<void>;
  refreshLocation: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

function SessionBridge({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const safety = useSafety();
  const security = useSecurity();
  const location = useLocation();

  const value: SessionContextValue = {
    profile: auth.profile,
    onboardingComplete: auth.onboardingComplete,
    loading: auth.loading || security.securityLoading,
    setProfile: auth.setProfile,
    completeOnboarding: auth.completeOnboarding,
    reset: auth.reset,
    safetyLevel: safety.safetyLevel,
    setSafetyLevel: safety.setSafetyLevel,
    pinEnabled: security.pinEnabled,
    locked: security.locked,
    disguiseEnabled: security.disguiseEnabled,
    disguiseStyle: security.disguiseStyle,
    setPinEnabled: security.setPinEnabled,
    unlock: security.unlock,
    lock: security.lock,
    setDisguiseEnabled: security.setDisguiseEnabled,
    setDisguiseStyle: security.setDisguiseStyle,
    nearbyState: location.nearbyState,
    nearbyResources: location.nearbyResources,
    refreshLocation: location.refreshLocation,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SafetyProvider>
        <SecurityProvider>
          <LocationProvider>
            <SessionBridge>{children}</SessionBridge>
          </LocationProvider>
        </SecurityProvider>
      </SafetyProvider>
    </AuthProvider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

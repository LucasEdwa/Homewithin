import {
    getSession,
    isOnboardingComplete,
    markOnboardingComplete,
    saveSession,
    getDisguiseEnabled as storageGetDisguiseEnabled,
    getDisguiseStyle as storageGetDisguiseStyle,
    hasPin as storageHasPin,
    setDisguiseEnabled as storageSetDisguiseEnabled,
    setDisguiseStyle as storageSetDisguiseStyle,
    type DisguiseStyle,
} from '@/services/storage';
import { supabase } from '@/services/supabase';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export interface UserProfile {
  nickname: string;
  pronouns: string;
  ageRange: string;
  language: string;
  country: string;
  hideFromSearch: boolean;
  needs: string[];
  intentions?: string[];
  isAnonymous: boolean;
}

export type SafetyLevel = 'green' | 'yellow' | 'red' | null;

interface SessionState {
  profile: UserProfile | null;
  safetyLevel: SafetyLevel;
  onboardingComplete: boolean;
  loading: boolean;
  pinEnabled: boolean;
  locked: boolean;
  disguiseEnabled: boolean;
  disguiseStyle: DisguiseStyle;
}

interface SessionContextValue extends SessionState {
  setProfile: (profile: UserProfile) => Promise<void>;
  setSafetyLevel: (level: SafetyLevel) => void;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
  setPinEnabled: (enabled: boolean) => void;
  unlock: () => void;
  lock: () => void;
  setDisguiseEnabled: (enabled: boolean) => Promise<void>;
  setDisguiseStyle: (style: DisguiseStyle) => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    profile: null,
    safetyLevel: null,
    onboardingComplete: false,
    loading: true,
    pinEnabled: false,
    locked: false,
    disguiseEnabled: false,
    disguiseStyle: 'weather',
  });
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    async function init() {
      const [complete, session, pinExists, disguiseOn, disguiseStyle] = await Promise.all([
        isOnboardingComplete(),
        getSession(),
        storageHasPin(),
        storageGetDisguiseEnabled(),
        storageGetDisguiseStyle(),
      ]);

      // If there's no local profile but the user is authenticated with Supabase,
      // hydrate the profile from the user_profiles table so the app is usable.
      let profile = session as UserProfile | null;
      if (!profile && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: row, error } = await supabase
              .from('user_profiles')
              .select('nickname, age_range, language, country, hide_from_search, needs, intentions')
              .eq('user_id', user.id)
              .maybeSingle();
            if (error) {
              console.warn('Profile hydrate select error:', error.message);
            }
            if (row) {
              profile = {
                nickname: row.nickname ?? '',
                pronouns: '',
                ageRange: row.age_range ?? '',
                language: row.language ?? '',
                country: row.country ?? '',
                hideFromSearch: !!row.hide_from_search,
                needs: row.needs ?? [],
                intentions: row.intentions ?? [],
                isAnonymous: true,
              };
              // Mirror to SecureStore so subsequent launches are offline-ready.
              await saveSession(profile).catch(() => {});
            } else {
              console.warn('Profile hydrate: no user_profiles row for uid', user.id, '— creating default');
              // Auto-create a minimal profile so the app is usable. User can edit later.
              const defaultRow = {
                user_id: user.id,
                nickname: user.email?.split('@')[0]?.slice(0, 24) || 'Friend',
                age_range: '',
                language: 'English',
                country: '',
                hide_from_search: false,
                needs: [],
                intentions: [],
              };
              const { error: insertErr } = await supabase
                .from('user_profiles')
                .insert(defaultRow);
              if (insertErr) {
                console.warn('Profile auto-create failed:', insertErr.message);
              } else {
                profile = {
                  nickname: defaultRow.nickname,
                  pronouns: '',
                  ageRange: '',
                  language: 'English',
                  country: '',
                  hideFromSearch: false,
                  needs: [],
                  intentions: [],
                  isAnonymous: true,
                };
                await saveSession(profile).catch(() => {});
              }
            }
          } else {
            console.warn('Profile hydrate: no authenticated Supabase user');
          }
        } catch (e: any) {
          console.warn('Profile hydrate from Supabase failed:', e?.message);
        }
      }

      setState((s) => ({
        ...s,
        onboardingComplete: complete || !!profile,
        profile,
        pinEnabled: pinExists,
        locked: pinExists, // require PIN entry on cold start
        disguiseEnabled: disguiseOn,
        disguiseStyle,
        loading: false,
      }));
    }
    init();
  }, []);

  // Re-lock when the app goes to background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (prev === 'active' && next.match(/inactive|background/)) {
        setState((s) => (s.pinEnabled ? { ...s, locked: true } : s));
      }
    });
    return () => sub.remove();
  }, []);

  async function setProfile(profile: UserProfile) {
    // Update React state first so controlled inputs (Switches, etc.) reflect
    // the change immediately; persist to secure storage in the background.
    setState((s) => ({ ...s, profile }));
    try {
      await saveSession(profile);
    } catch (e: any) {
      console.error('saveSession failed:', e?.message);
      throw e;
    }
  }

  function setSafetyLevel(safetyLevel: SafetyLevel) {
    setState((s) => ({ ...s, safetyLevel }));
  }

  async function completeOnboarding() {
    await markOnboardingComplete();
    setState((s) => ({ ...s, onboardingComplete: true }));
  }

  function setPinEnabled(enabled: boolean) {
    setState((s) => ({ ...s, pinEnabled: enabled, locked: enabled ? s.locked : false }));
  }

  function unlock() {
    setState((s) => ({ ...s, locked: false }));
  }

  function lock() {
    setState((s) => (s.pinEnabled ? { ...s, locked: true } : s));
  }

  function reset() {
    setState({
      profile: null,
      safetyLevel: null,
      onboardingComplete: false,
      loading: false,
      pinEnabled: false,
      locked: false,
      disguiseEnabled: false,
      disguiseStyle: 'weather',
    });
  }

  async function setDisguiseEnabled(enabled: boolean) {
    setState((s) => ({ ...s, disguiseEnabled: enabled }));
    try {
      await storageSetDisguiseEnabled(enabled);
    } catch (e: any) {
      console.error('setDisguiseEnabled failed:', e?.message);
    }
  }

  async function setDisguiseStyle(style: DisguiseStyle) {
    setState((s) => ({ ...s, disguiseStyle: style }));
    try {
      await storageSetDisguiseStyle(style);
    } catch (e: any) {
      console.error('setDisguiseStyle failed:', e?.message);
    }
  }

  return (
    <SessionContext.Provider
      value={{
        ...state,
        setProfile,
        setSafetyLevel,
        completeOnboarding,
        reset,
        setPinEnabled,
        unlock,
        lock,
        setDisguiseEnabled,
        setDisguiseStyle,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

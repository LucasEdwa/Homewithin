import {
  getSession,
  isOnboardingComplete,
  markOnboardingComplete,
  saveSession,
} from '@/services/storage';
import { supabase } from '@/services/supabase';
import type { UserProfile } from '@/types/user';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type { UserProfile };

interface AuthState {
  profile: UserProfile | null;
  onboardingComplete: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  setProfile: (profile: UserProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type ProfileRow = {
  nickname: string | null;
  age_range: string | null;
  language: string | null;
  country: string | null;
  hide_from_search: boolean | null;
  needs: string[] | null;
  intentions: string[] | null;
  avatar_url: string | null;
};

function buildHydratedProfile(row: ProfileRow): UserProfile {
  return {
    nickname: row.nickname ?? '',
    pronouns: '',
    ageRange: row.age_range ?? '',
    language: row.language ?? '',
    country: row.country ?? '',
    hideFromSearch: !!row.hide_from_search,
    needs: row.needs ?? [],
    intentions: row.intentions ?? [],
    isAnonymous: false,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    profile: null,
    onboardingComplete: false,
    loading: true,
  });

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const uid = session.user.id;
        const { data: row } = await client
          .from('user_profiles')
          .select('nickname, age_range, language, country, hide_from_search, needs, intentions, avatar_url')
          .eq('user_id', uid)
          .maybeSingle();
        if (row) {
          const hydrated = buildHydratedProfile(row);
          setState(s => ({ ...s, profile: hydrated, onboardingComplete: true }));
          await saveSession(hydrated).catch(() => {});
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function init() {
      // Outer try/catch ensures loading is always cleared even if SecureStore
      // throws on fresh install or an unusual keychain state.
      let complete = false;
      let profile: UserProfile | null = null;
      try {
        const [c, session] = await Promise.all([
          isOnboardingComplete(),
          getSession(),
        ]);
        complete = c;
        profile = session as UserProfile | null;
      } catch (e: any) {
        console.warn('Auth init storage read failed:', e?.message);
        // Fall through with defaults; loading will still be cleared below.
      }

      if (supabase) {
        try {
          // Single timeout covers getUser() AND all subsequent profile queries.
          // Reusing the same Promise means the 8-second budget is shared across
          // the entire Supabase block, not reset per call.
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('auth init timeout')), 8000)
          );
          const { data: { user } } = await Promise.race([
            supabase.auth.getUser(),
            timeout,
          ]);
          if (user) {
            const { data: row, error } = await Promise.race([
              supabase
                .from('user_profiles')
                .select('nickname, age_range, language, country, hide_from_search, needs, intentions, avatar_url')
                .eq('user_id', user.id)
                .maybeSingle(),
              timeout,
            ]);
            if (error) {
              console.warn('Profile hydrate select error:', error.message);
            }
            if (row) {
              profile = buildHydratedProfile(row);
              await saveSession(profile).catch(() => {});
            } else {
              console.warn('Profile hydrate: no user_profiles row for uid', user.id, '— creating default');
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
              const insertResult = await Promise.race([
                supabase.from('user_profiles').insert(defaultRow),
                timeout,
              ]);
              if (insertResult.error) {
                console.warn('Profile auto-create failed:', insertResult.error.message);
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
            console.log('Profile hydrate: no authenticated Supabase user (guest session)');
          }
        } catch (e: any) {
          console.warn('Profile hydrate from Supabase failed:', e?.message);
        }
      }

      setState(s => ({
        ...s,
        onboardingComplete: complete || !!profile,
        profile,
        loading: false,
      }));
    }
    init();
  }, []);

  async function setProfile(profile: UserProfile) {
    setState(s => ({ ...s, profile }));
    try {
      await saveSession(profile);
    } catch (e: any) {
      console.error('saveSession failed:', e?.message);
      throw e;
    }
  }

  async function completeOnboarding() {
    await markOnboardingComplete();
    setState(s => ({ ...s, onboardingComplete: true }));
  }

  function reset() {
    setState({ profile: null, onboardingComplete: false, loading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, setProfile, completeOnboarding, reset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

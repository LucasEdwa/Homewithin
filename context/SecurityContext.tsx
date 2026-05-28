import {
  getDisguiseEnabled as storageGetDisguiseEnabled,
  getDisguiseStyle as storageGetDisguiseStyle,
  hasPin as storageHasPin,
  setDisguiseEnabled as storageSetDisguiseEnabled,
  setDisguiseStyle as storageSetDisguiseStyle,
} from '@/services/storage';
import type { DisguiseStyle } from '@/types/user';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface SecurityState {
  pinEnabled: boolean;
  locked: boolean;
  disguiseEnabled: boolean;
  disguiseStyle: DisguiseStyle;
  securityLoading: boolean;
}

interface SecurityContextValue extends SecurityState {
  setPinEnabled: (enabled: boolean) => void;
  unlock: () => void;
  lock: () => void;
  setDisguiseEnabled: (enabled: boolean) => Promise<void>;
  setDisguiseStyle: (style: DisguiseStyle) => Promise<void>;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SecurityState>({
    pinEnabled: false,
    locked: false,
    disguiseEnabled: false,
    disguiseStyle: 'weather',
    securityLoading: true,
  });
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    async function init() {
      try {
        const [pinExists, disguiseOn, disguiseStyle] = await Promise.all([
          storageHasPin(),
          storageGetDisguiseEnabled(),
          storageGetDisguiseStyle(),
        ]);
        setState(s => ({
          ...s,
          pinEnabled: pinExists,
          locked: pinExists,
          disguiseEnabled: disguiseOn,
          disguiseStyle,
          securityLoading: false,
        }));
      } catch (e: any) {
        // SecureStore can fail on fresh install or unusual keychain states.
        // Always clear securityLoading so the splash screen can navigate.
        console.warn('Security init failed:', e?.message);
        setState(s => ({ ...s, securityLoading: false }));
      }
    }
    init();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (prev === 'active' && next.match(/inactive|background/)) {
        setState(s => (s.pinEnabled ? { ...s, locked: true } : s));
      }
    });
    return () => sub.remove();
  }, []);

  function setPinEnabled(enabled: boolean) {
    setState(s => ({ ...s, pinEnabled: enabled, locked: enabled ? s.locked : false }));
  }

  function unlock() {
    setState(s => ({ ...s, locked: false }));
  }

  function lock() {
    setState(s => (s.pinEnabled ? { ...s, locked: true } : s));
  }

  async function setDisguiseEnabled(enabled: boolean) {
    setState(s => ({ ...s, disguiseEnabled: enabled }));
    try {
      await storageSetDisguiseEnabled(enabled);
    } catch (e: any) {
      console.error('setDisguiseEnabled failed:', e?.message);
    }
  }

  async function setDisguiseStyle(style: DisguiseStyle) {
    setState(s => ({ ...s, disguiseStyle: style }));
    try {
      await storageSetDisguiseStyle(style);
    } catch (e: any) {
      console.error('setDisguiseStyle failed:', e?.message);
    }
  }

  return (
    <SecurityContext.Provider
      value={{ ...state, setPinEnabled, unlock, lock, setDisguiseEnabled, setDisguiseStyle }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
  return ctx;
}

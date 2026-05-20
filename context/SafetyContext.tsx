import type { SafetyLevel } from '@/types/user';
import React, { createContext, useContext, useState } from 'react';

export type { SafetyLevel };

interface SafetyContextValue {
  safetyLevel: SafetyLevel;
  setSafetyLevel: (level: SafetyLevel) => void;
}

const SafetyContext = createContext<SafetyContextValue | null>(null);

export function SafetyProvider({ children }: { children: React.ReactNode }) {
  const [safetyLevel, setSafetyLevelState] = useState<SafetyLevel>(null);

  function setSafetyLevel(level: SafetyLevel) {
    setSafetyLevelState(level);
  }

  return (
    <SafetyContext.Provider value={{ safetyLevel, setSafetyLevel }}>
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider');
  return ctx;
}

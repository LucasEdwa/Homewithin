import { getResources, requestLocationPermission } from '@/services/content/localResources';
import type { LocalResource } from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface LocationState {
  nearbyState: string | null;
  nearbyResources: LocalResource[];
}

interface LocationContextValue extends LocationState {
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocationState>({
    nearbyState: null,
    nearbyResources: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const result = await requestLocationPermission();
        if (result.granted && result.state) {
          setState(s => ({
            ...s,
            nearbyState: result.state!,
            nearbyResources: getResources(result.state!).slice(0, 5),
          }));
        }
      } catch { /* silently ignore */ }
    })();
  }, []);

  async function refreshLocation() {
    try {
      const result = await requestLocationPermission();
      if (result.granted && result.state) {
        setState(s => ({
          ...s,
          nearbyState: result.state!,
          nearbyResources: getResources(result.state!).slice(0, 5),
        }));
      }
    } catch { /* silently ignore */ }
  }

  return (
    <LocationContext.Provider value={{ ...state, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}

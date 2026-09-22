import { useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { setLocale } from '@/i18n';

export function useLanguage() {
  const { profile } = useSession();

  useEffect(() => {
    // When no profile exists the i18n default ('sv') is already active.
    // Only override if the user has explicitly chosen English.
    if (profile?.language) {
      setLocale(profile.language);
    }
  }, [profile?.language]);
}

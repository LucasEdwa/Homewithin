import { getJournalEntries, getRecentCheckIns, getTodayCheckIn } from '@/services/storage';
import type { CheckIn, JournalEntry } from '@/types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function useCheckIns() {
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [today, recent, entries] = await Promise.all([
          getTodayCheckIn(),
          getRecentCheckIns(7),
          getJournalEntries(),
        ]);
        setTodayCheckIn(today);
        setRecentCheckIns(recent);
        setRecentEntries(entries.slice(0, 4));
      }
      load();
    }, [])
  );

  return { todayCheckIn, recentCheckIns, recentEntries };
}

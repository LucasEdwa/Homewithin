import { getUnreadCounts, markMatchRead } from '@/services/social/unread';
import { currentUserId, supabase } from '@/services/supabase';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface UnreadContextValue {
  unreadByMatch: Record<string, number>;
  totalUnread: number;
  refresh: (matchIds: string[]) => Promise<void>;
  markRead: (matchId: string) => Promise<void>;
  setActiveMatch: (matchId: string | null) => void;
}

const UnreadContext = createContext<UnreadContextValue | null>(null);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadByMatch, setUnreadByMatch] = useState<Record<string, number>>({});
  const refreshing = useRef(false);
  const matchIdsRef = useRef<Set<string>>(new Set());
  const activeMatchRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);

  // Subscribe once to all message inserts. Supabase realtime + RLS means we only
  // receive rows the user can SELECT — no need for a server-side filter here.
  useEffect(() => {
    if (!supabase) return;

    channelRef.current = supabase
      .channel('unread-tracker')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const row = payload.new as { match_id: string; sender_id: string };
          const uid = await currentUserId();
          // Ignore my own messages and chats I currently have open.
          if (row.sender_id === uid) return;
          if (!matchIdsRef.current.has(row.match_id)) return;
          if (activeMatchRef.current === row.match_id) return;

          setUnreadByMatch((prev) => ({
            ...prev,
            [row.match_id]: (prev[row.match_id] ?? 0) + 1,
          }));
        },
      )
      .subscribe();

    return () => {
      if (channelRef.current && supabase) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const refresh = useCallback(async (matchIds: string[]) => {
    if (refreshing.current) return;
    refreshing.current = true;
    matchIdsRef.current = new Set(matchIds);
    try {
      const counts = await getUnreadCounts(matchIds);
      setUnreadByMatch(counts);
    } finally {
      refreshing.current = false;
    }
  }, []);

  const markRead = useCallback(async (matchId: string) => {
    await markMatchRead(matchId);
    setUnreadByMatch((prev) => ({ ...prev, [matchId]: 0 }));
  }, []);

  const setActiveMatch = useCallback((matchId: string | null) => {
    activeMatchRef.current = matchId;
    if (matchId) {
      // Clear the badge for this match immediately when user enters the chat.
      setUnreadByMatch((prev) => ({ ...prev, [matchId]: 0 }));
    }
  }, []);

  const totalUnread = Object.values(unreadByMatch).reduce((s, n) => s + n, 0);

  return (
    <UnreadContext.Provider value={{ unreadByMatch, totalUnread, refresh, markRead, setActiveMatch }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnread must be used within UnreadProvider');
  return ctx;
}

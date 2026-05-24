import { useSession } from "@/context/SessionContext";
import { useUnread } from "@/context/UnreadContext";
import {
  getIncomingLikes,
  getMyMatches,
  getPendingOutgoing,
  syncProfile,
} from "@/services/social/matching";
import type { Match } from "@/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useMatches() {
  const { profile } = useSession();
  const { refresh: refreshUnread } = useUnread();
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<Match[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<Match[]>([]);

  async function refreshMatchLists() {
    const [matches, pending, incoming] = await Promise.all([
      getMyMatches(),
      getPendingOutgoing(),
      getIncomingLikes(),
    ]);
    setMyMatches(matches);
    setPendingOutgoing(pending);
    setIncomingLikes(incoming);
    if (matches.length > 0) refreshUnread(matches.map((m) => m.id));
  }

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (profile) await syncProfile(profile);
        await refreshMatchLists();
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]),
  );

  return { myMatches, pendingOutgoing, incomingLikes, refreshMatchLists };
}

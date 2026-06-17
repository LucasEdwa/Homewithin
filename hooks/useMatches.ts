import { useSession } from "@/context/SessionContext";
import { useUnread } from "@/context/UnreadContext";
import { getLastMessagesByMatchIds } from "@/services/social/chat";
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

    let hydratedMatches = matches;
    if (matches.length > 0) {
      const lastMsgs = await getLastMessagesByMatchIds(matches.map((m) => m.id));
      hydratedMatches = matches
        .map((m) => ({ ...m, lastMessage: lastMsgs[m.id] }))
        .sort((a, b) => {
          const ta = a.lastMessage?.createdAt ?? a.createdAt;
          const tb = b.lastMessage?.createdAt ?? b.createdAt;
          return tb.localeCompare(ta);
        });
      refreshUnread(matches.map((m) => m.id));
    }

    setMyMatches(hydratedMatches);
    setPendingOutgoing(pending);
    setIncomingLikes(incoming);
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

import { useUnread } from "@/context/UnreadContext";
import { getMessages, subscribeToMessages } from "@/services/social/chat";
import type { Message } from "@/types";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function useMessages(matchId: string | undefined) {
  const { markRead } = useUnread();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!matchId) return;

    function loadMessages() {
      getMessages(matchId!).then((msgs) => setMessages(msgs));
      markRead(matchId!);
    }

    loadMessages();

    const unsub = subscribeToMessages(
      matchId,
      (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        markRead(matchId!);
      },
      (updated) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
        );
      },
      // When the realtime channel errors or times out, re-fetch so we don't miss
      // messages that arrived while the connection was down.
      () => loadMessages(),
    );

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadMessages();
    });

    // Expiry purge is handled by useChatScreen (30 s interval). No duplicate needed here.

    return () => {
      unsub();
      appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return { messages, setMessages };
}

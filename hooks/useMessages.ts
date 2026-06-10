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
          prev.map((m) => (m.id === updated.id ? { ...m, liked: updated.liked } : m)),
        );
      },
    );

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadMessages();
    });

    const purgeInterval = setInterval(() => {
      const now = new Date();
      setMessages((prev) => prev.filter((m) => !m.expiresAt || new Date(m.expiresAt) > now));
    }, 60_000);

    return () => {
      unsub();
      appStateSub.remove();
      clearInterval(purgeInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return { messages, setMessages };
}

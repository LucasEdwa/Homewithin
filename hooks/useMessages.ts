import { useUnread } from '@/context/UnreadContext';
import { getMessages, subscribeToMessages } from '@/services/social/chat';
import type { Message } from '@/types';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

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

    const unsub = subscribeToMessages(matchId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      markRead(matchId!);
    });

    // Refetch on foreground — covers WebSocket gaps when the app was backgrounded.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadMessages();
    });

    return () => {
      unsub();
      appStateSub.remove();
    };
  }, [matchId]);

  return { messages, setMessages };
}

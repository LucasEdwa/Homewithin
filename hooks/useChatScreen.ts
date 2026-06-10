import { useUnread } from '@/context/UnreadContext';
import { useMessages } from '@/hooks/useMessages';
import { containsCrisisKeywords, deleteMessage, sendMessage, applyExpiryToMatch, toggleMessageLike } from '@/services/social/chat';
import { filterContent } from '@/services/social/contentFilter';
import { blockUser, getMatchPeerId, reportMessage } from '@/services/social/matching';
import { supabase } from '@/services/supabase';
import type { Message } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform } from 'react-native';

export const EXPIRY_OPTIONS: { label: string; hours: number | null }[] = [
  { label: 'Off',      hours: null },
  { label: '1 hour',   hours: 1   },
  { label: '6 hours',  hours: 6   },
  { label: '24 hours', hours: 24  },
  { label: '7 days',   hours: 168 },
];

export type ListItem =
  | { type: 'message';    data: Message }
  | { type: 'dateHeader'; label: string; key: string }
  | { type: 'unreadSeparator'; key: string; count: number };

function isExpired(msg: Message) {
  return !!msg.expiresAt && new Date(msg.expiresAt) < new Date();
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function buildListItems(messages: Message[], initialUnread: number): ListItem[] {
  const items: ListItem[] = [];
  let lastDateStr = '';
  const unreadStartIdx = initialUnread > 0 ? Math.max(0, messages.length - initialUnread) : -1;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const dateStr = new Date(msg.createdAt).toDateString();
    if (dateStr !== lastDateStr) {
      lastDateStr = dateStr;
      items.push({ type: 'dateHeader', label: formatDateLabel(new Date(msg.createdAt)), key: `dh-${dateStr}` });
    }
    if (i === unreadStartIdx) {
      items.push({ type: 'unreadSeparator', key: 'unread-sep', count: initialUnread });
    }
    items.push({ type: 'message', data: msg });
  }
  // Reverse so newest is at index 0 — used with FlatList inverted={true}, which renders
  // index 0 at the bottom. The list therefore opens at the latest message with no scroll.
  return [...items].reverse();
}

export function useChatScreen() {
  const { matchId, nickname, avatarUrl } = useLocalSearchParams<{
    matchId: string;
    nickname: string;
    avatarUrl?: string;
  }>();
  const { setActiveMatch, unreadByMatch } = useUnread();
  const { messages, setMessages } = useMessages(matchId);
  const [input, setInput] = useState('');
  const [expiryHours, setExpiryHours] = useState<number | null>(null);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const listRef = useRef<FlatList>(null);

  // Captured once on mount, before setActiveMatch resets the badge count.
  const initialUnreadCount = useRef(matchId ? (unreadByMatch[matchId] ?? 0) : 0);

  const listItems = useMemo(
    () => buildListItems(messages.filter((m) => !isExpired(m)), initialUnreadCount.current),
    [messages],
  );

  useEffect(() => {
    supabase?.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!matchId) return;
    setActiveMatch(matchId);
    return () => setActiveMatch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Remove expired messages from local state every 30 s.
  useEffect(() => {
    const id = setInterval(() => {
      setMessages((prev) => prev.filter((m) => !isExpired(m)));
    }, 30_000);
    return () => clearInterval(id);
  }, [setMessages]);

  async function handleSend() {
    if (!input.trim() || !matchId) return;
    const body = input.trim();
    const filterResult = filterContent(body);
    if (!filterResult.ok) {
      if (filterResult.ok === false) {
        Alert.alert('Message blocked', filterResult.reason);
        return;
      }
    }
    if (filterResult.ok === 'warn') {
      Alert.alert(
        'Strong language',
        filterResult.reason,
        [
          { text: 'Edit message', style: 'cancel' },
          { text: 'Send anyway', onPress: () => doSend(body) },
        ],
      );
      return;
    }
    doSend(body);
  }

  async function doSend(body: string) {
    const currentReplyTo = replyTo;
    setInput('');
    setReplyTo(null);
    setSending(true);
    if (containsCrisisKeywords(body)) setShowCrisisBanner(true);
    const msg = await sendMessage(
      matchId!,
      body,
      expiryHours,
      currentReplyTo
        ? { id: currentReplyTo.id, body: currentReplyTo.body, senderId: currentReplyTo.senderId }
        : undefined,
    );
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    }
    // With inverted FlatList, offset 0 = the bottom (newest messages).
    // Scroll there so the user always sees the message they just sent.
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    setSending(false);
  }

  async function handleLike(message: Message) {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, liked: !m.liked } : m)),
    );
    const ok = await toggleMessageLike(message.id, !!message.liked);
    if (!ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, liked: message.liked } : m)),
      );
    }
  }

  function handlePickExpiry() {
    const labels = [...EXPIRY_OPTIONS.map((o) => o.label), 'Cancel'];
    const applySelection = async (option: typeof EXPIRY_OPTIONS[number]) => {
      setExpiryHours(option.hours);
      if (option.hours !== null && matchId) {
        applyExpiryToMatch(matchId, option.hours).catch(() => {});
        const expiresAt = new Date(
          Date.now() + option.hours * 60 * 60 * 1000,
        ).toISOString();
        setMessages((prev) =>
          prev
            .map((m) => ({
              ...m,
              expiresAt:
                !m.expiresAt || m.expiresAt > expiresAt
                  ? expiresAt
                  : m.expiresAt,
            }))
            .filter((m) => !isExpired(m)),
        );
      }
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: labels, cancelButtonIndex: labels.length - 1, title: 'Auto-delete messages after…' },
        (idx) => { if (idx < EXPIRY_OPTIONS.length) applySelection(EXPIRY_OPTIONS[idx]); }
      );
    } else {
      Alert.alert('Auto-delete after…', undefined, [
        ...EXPIRY_OPTIONS.map((o) => ({ text: o.label, onPress: () => applySelection(o) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }

  function confirmBlock() {
    Alert.alert(
      'Block this person?',
      "They won't be able to contact you. This cannot be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            if (!matchId) {
              Alert.alert('Block failed', 'Missing match info. Please try again.');
              return;
            }
            let targetId = await getMatchPeerId(matchId);
            if (!targetId) {
              const theirMsg = messages.find((m) => m.senderId !== myUserId);
              targetId = theirMsg?.senderId ?? null;
            }
            if (!targetId) {
              Alert.alert('Block failed', 'Could not identify the other user.');
              return;
            }
            const ok = await blockUser(targetId, matchId);
            if (!ok) {
              Alert.alert('Block failed', 'Please check your connection and try again.');
              return;
            }
            router.back();
          },
        },
      ]
    );
  }

  function promptReportMessage() {
    Alert.prompt(
      'Report a message',
      'Briefly describe the issue (e.g. harassment, threats):',
      async (reason) => {
        if (!reason?.trim()) return;
        const lastTheirMsg = [...messages].reverse().find((m) => m.senderId !== myUserId);
        if (lastTheirMsg) {
          await reportMessage(lastTheirMsg.id, lastTheirMsg.senderId, reason.trim());
          Alert.alert('Reported', "Thank you. We'll review this shortly.");
        }
      },
      'plain-text'
    );
  }

  function handleOptions() {
    const options = ['Block & report user', 'Report a message', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 0, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) confirmBlock();
          if (idx === 1) promptReportMessage();
        }
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Block & report user', style: 'destructive', onPress: confirmBlock },
        { text: 'Report a message', onPress: promptReportMessage },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  function handleDeleteMessage(messageId: string) {
    Alert.alert(
      'Delete message?',
      'This will remove the message for everyone in this chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteMessage(messageId);
            if (ok) {
              setMessages((prev) => prev.filter((m) => m.id !== messageId));
            } else {
              Alert.alert('Delete failed', 'Please check your connection and try again.');
            }
          },
        },
      ]
    );
  }

  return {
    matchId,
    nickname,
    avatarUrl,
    myUserId,
    listRef,
    listItems,
    input,
    setInput,
    expiryHours,
    sending,
    showCrisisBanner,
    setShowCrisisBanner,
    replyTo,
    setReplyTo,
    handleSend,
    handleLike,
    handlePickExpiry,
    handleOptions,
    handleDeleteMessage,
  };
}

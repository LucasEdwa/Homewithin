import { useUnread } from '@/context/UnreadContext';
import { useMessages } from '@/hooks/useMessages';
import { containsCrisisKeywords, deleteMessage, sendMessage } from '@/services/social/chat';
import { filterContent } from '@/services/social/contentFilter';
import { blockUser, getMatchPeerId, reportMessage } from '@/services/social/matching';
import { supabase } from '@/services/supabase';
import type { Message } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  | { type: 'dateHeader'; label: string; key: string };

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

function buildListItems(messages: Message[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDateStr = '';
  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toDateString();
    if (dateStr !== lastDateStr) {
      lastDateStr = dateStr;
      items.push({ type: 'dateHeader', label: formatDateLabel(new Date(msg.createdAt)), key: `dh-${dateStr}` });
    }
    items.push({ type: 'message', data: msg });
  }
  return items;
}

export function useChatScreen() {
  const { matchId, nickname, avatarUrl } = useLocalSearchParams<{
    matchId: string;
    nickname: string;
    avatarUrl?: string;
  }>();
  const { setActiveMatch } = useUnread();
  const { messages, setMessages } = useMessages(matchId);
  const [input, setInput] = useState('');
  const [expiryHours, setExpiryHours] = useState<number | null>(null);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id ?? null));
  }, []);

  // Tell UnreadContext this chat is active so incoming messages don't increment the badge.
  useEffect(() => {
    if (!matchId) return;
    setActiveMatch(matchId);
    return () => setActiveMatch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Scroll to end when messages load or a new one arrives.
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: messages.length > 0 }), 50);
  }, [messages.length]);

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
    setInput('');
    setSending(true);
    if (containsCrisisKeywords(body)) setShowCrisisBanner(true);
    const msg = await sendMessage(matchId!, body, expiryHours);
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    }
    setSending(false);
  }

  function handlePickExpiry() {
    const labels = [...EXPIRY_OPTIONS.map((o) => o.label), 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: labels, cancelButtonIndex: labels.length - 1, title: 'Auto-delete messages after…' },
        (idx) => { if (idx < EXPIRY_OPTIONS.length) setExpiryHours(EXPIRY_OPTIONS[idx].hours); }
      );
    } else {
      Alert.alert('Auto-delete after…', undefined, [
        ...EXPIRY_OPTIONS.map((o) => ({ text: o.label, onPress: () => setExpiryHours(o.hours) })),
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
    listItems: buildListItems(messages.filter((m) => !isExpired(m))),
    input,
    setInput,
    expiryHours,
    sending,
    showCrisisBanner,
    setShowCrisisBanner,
    handleSend,
    handlePickExpiry,
    handleOptions,
    handleDeleteMessage,
  };
}

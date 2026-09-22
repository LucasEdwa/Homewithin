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
import { useTranslation } from 'react-i18next';

export const EXPIRY_OPTIONS: { labelKey: string; hours: number | null }[] = [
  { labelKey: 'chat.expiryOff',  hours: null },
  { labelKey: 'chat.expiry1h',   hours: 1   },
  { labelKey: 'chat.expiry6h',   hours: 6   },
  { labelKey: 'chat.expiry24h',  hours: 24  },
  { labelKey: 'chat.expiry7d',   hours: 168 },
];

export type ListItem =
  | { type: 'message';    data: Message }
  | { type: 'dateHeader'; label: string; key: string }
  | { type: 'unreadSeparator'; key: string; count: number };

function isExpired(msg: Message) {
  return !!msg.expiresAt && new Date(msg.expiresAt) < new Date();
}

function formatDateLabel(date: Date, t: (key: string) => string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return t('circle.today');
  if (date.toDateString() === yesterday.toDateString()) return t('circle.yesterday');
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function buildListItems(messages: Message[], initialUnread: number, t: (key: string) => string): ListItem[] {
  const items: ListItem[] = [];
  let lastDateStr = '';
  const unreadStartIdx = initialUnread > 0 ? Math.max(0, messages.length - initialUnread) : -1;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const dateStr = new Date(msg.createdAt).toDateString();
    if (dateStr !== lastDateStr) {
      lastDateStr = dateStr;
      items.push({ type: 'dateHeader', label: formatDateLabel(new Date(msg.createdAt), t), key: `dh-${dateStr}` });
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
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    matchId: string;
    nickname?: string;
    avatarUrl?: string;
  }>();
  const matchId = params.matchId;

  // nickname/avatarUrl are absent when the chat is opened via a push notification
  // (the deep link only carries matchId). Fetch them from Supabase in that case.
  const [nickname, setNickname] = useState(params.nickname ?? '');
  const [avatarUrl, setAvatarUrl] = useState(params.avatarUrl ?? '');

  useEffect(() => {
    if (nickname || !matchId) return;
    let cancelled = false;
    getMatchPeerId(matchId).then(async (peerId) => {
      if (cancelled || !peerId || !supabase) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('nickname, avatar_url')
        .eq('user_id', peerId)
        .single();
      if (!cancelled && data) {
        setNickname(data.nickname ?? '');
        setAvatarUrl(data.avatar_url ?? '');
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

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
    () => buildListItems(messages.filter((m) => !isExpired(m)), initialUnreadCount.current, t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (filterResult.ok === false) {
      Alert.alert(t('chat.messageBlocked'), filterResult.reason);
      return;
    }
    if (filterResult.ok === 'warn') {
      Alert.alert(
        t('chat.strongLanguage'),
        filterResult.reason,
        [
          { text: t('chat.editMessage'), style: 'cancel' },
          { text: t('chat.sendAnyway'), onPress: () => doSend(body) },
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
      // With inverted FlatList, offset 0 = the bottom (newest messages).
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    } else {
      // Restore state so the user can retry without re-typing.
      setInput(body);
      setReplyTo(currentReplyTo);
      Alert.alert(t('chat.failedToSend'), t('chat.failedToSendBody'));
    }
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
    const labels = [...EXPIRY_OPTIONS.map((o) => t(o.labelKey)), t('common.cancel')];
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
        { options: labels, cancelButtonIndex: labels.length - 1, title: t('chat.autoDeleteTitle') },
        (idx) => { if (idx < EXPIRY_OPTIONS.length) applySelection(EXPIRY_OPTIONS[idx]); }
      );
    } else {
      Alert.alert(t('chat.autoDeleteAndroid'), undefined, [
        ...EXPIRY_OPTIONS.map((o) => ({ text: t(o.labelKey), onPress: () => applySelection(o) })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ]);
    }
  }

  function confirmBlock() {
    Alert.alert(
      t('chat.blockTitle'),
      t('chat.blockBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.block'),
          style: 'destructive',
          onPress: async () => {
            if (!matchId) {
              Alert.alert(t('chat.blockFailed'), t('chat.blockFailedMissing'));
              return;
            }
            let targetId = await getMatchPeerId(matchId);
            if (!targetId) {
              const theirMsg = messages.find((m) => m.senderId !== myUserId);
              targetId = theirMsg?.senderId ?? null;
            }
            if (!targetId) {
              Alert.alert(t('chat.blockFailed'), t('chat.blockFailedUnknown'));
              return;
            }
            const ok = await blockUser(targetId, matchId);
            if (!ok) {
              Alert.alert(t('chat.blockFailed'), t('chat.blockFailedConnection'));
              return;
            }
            router.back();
          },
        },
      ]
    );
  }

  function promptReportMessage() {
    const submit = async (reason: string) => {
      const lastTheirMsg = [...messages].reverse().find((m) => m.senderId !== myUserId);
      if (lastTheirMsg) {
        await reportMessage(lastTheirMsg.id, lastTheirMsg.senderId, reason);
        Alert.alert(t('chat.reported'), t('chat.reportedBody'));
      }
    };

    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('chat.reportTitle'),
        t('chat.reportPrompt'),
        async (reason) => { if (reason?.trim()) await submit(reason.trim()); },
        'plain-text',
      );
    } else {
      const REASONS = [t('chat.reportHarassment'), t('chat.reportInappropriate'), t('chat.reportSpam'), t('chat.reportOther')];
      Alert.alert(
        t('chat.reportTitle'),
        t('chat.reportWhatIsIssue'),
        [
          ...REASONS.map((r) => ({ text: r, onPress: () => submit(r) })),
          { text: t('common.cancel'), style: 'cancel' as const },
        ],
      );
    }
  }

  function handleOptions() {
    const options = [t('chat.blockReport'), t('chat.reportMessage'), t('common.cancel')];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 0, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) confirmBlock();
          if (idx === 1) promptReportMessage();
        }
      );
    } else {
      Alert.alert(t('chat.options'), undefined, [
        { text: t('chat.blockReport'), style: 'destructive', onPress: confirmBlock },
        { text: t('chat.reportMessage'), onPress: promptReportMessage },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }

  function handleDeleteMessage(messageId: string) {
    Alert.alert(
      t('chat.deleteMessage'),
      t('chat.deleteMessageBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteMessage(messageId);
            if (ok) {
              setMessages((prev) => prev.filter((m) => m.id !== messageId));
            } else {
              Alert.alert(t('chat.deleteFailed'), t('chat.deleteFailedBody'));
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

import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useTranslation } from 'react-i18next';
import { grantCircleAIConsent, hasCircleAIConsent } from '@/services/storage';
import { containsCrisisKeywords } from '@/services/social/chat';
import {
    deleteCircleMessage,
    getCircle,
  kickCircleMember,
    getCircleMembers,
    getCircleMessages,
    leaveCircle,
    reportInCircle,
    sendCircleMessage,
    subscribeToCircleMessages,
} from '@/services/social/circles';
import { blockUser, getBlockedUserIds } from '@/services/social/matching';
import { filterContent } from '@/services/social/contentFilter';
import { supabase } from '@/services/supabase';
import { AI_DISCLAIMER, sendCircleAIMessage } from '@/services/wellness/ai';
import type { CircleMember, CircleMessage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActionSheetIOS,
  ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
  Modal,
    Platform,
    SafeAreaView,
  ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const CRISIS_HOTLINE =
  'Trevor Project (LGBTQ+): 1-866-488-7386\nCrisis Text Line: text HOME to 741741';
const AI_COMPANION_ID = 'ai-companion';

type ListItem =
  | { type: 'message'; data: CircleMessage }
  | { type: 'date'; label: string; key: string };

type MentionSuggestion = {
  key: string;
  label: string;
  mentionValue: string;
  isAI?: boolean;
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDayLabel(date: Date, t: (key: string) => string): string {
  const now = new Date();
  const todayKey = dayKey(now);
  const msgKey = dayKey(date);
  const diffMs =
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (msgKey === todayKey) return t('circle.today');
  if (diffDays === 1) return t('circle.yesterday');
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildListItems(messages: CircleMessage[], t: (key: string) => string): ListItem[] {
  const items: ListItem[] = [];
  let lastKey = '';
  for (const msg of messages) {
    const date = new Date(msg.createdAt);
    const key = dayKey(date);
    if (key !== lastKey) {
      items.push({ type: 'date', label: formatDayLabel(date, t), key: `date-${key}` });
      lastKey = key;
    }
    items.push({ type: 'message', data: msg });
  }
  return items;
}

function getMentionQuery(text: string): string | null {
  const match = text.match(/(?:^|\s)@([\w.-]*)$/);
  if (!match) return null;
  return match[1] ?? '';
}

function mentionValueForName(name: string): string {
  return name.trim().replace(/\s+/g, '_');
}

export default function CircleChatScreen() {
  const { t } = useTranslation();
  const { circleId, name } = useLocalSearchParams<{ circleId: string; name: string }>();
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [input, setInput] = useState('');
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showAIConsentModal, setShowAIConsentModal] = useState(false);
  const [circleAIConsented, setCircleAIConsented] = useState(false);
  const [circleTitle, setCircleTitle] = useState(name ?? 'Circle');
  const membersMapRef = useRef<Map<string, { nickname: string; avatarUrl?: string }>>(new Map());
  const blockedUserIdsRef = useRef<Set<string>>(new Set());
  const pendingAIMessageRef = useRef<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const mentionQuery = useMemo(() => getMentionQuery(input), [input]);
  const mentionSuggestions = useMemo<MentionSuggestion[]>(() => {
    if (mentionQuery == null) return [];
    const q = mentionQuery.toLowerCase();

    const userSuggestions = members
      .map((member) => ({
        key: member.userId,
        label: member.nickname,
        mentionValue: mentionValueForName(member.nickname),
      }))
      .filter((item) => {
        if (!q) return true;
        return item.label.toLowerCase().includes(q) || item.mentionValue.toLowerCase().includes(q);
      });

    const aiSuggestion: MentionSuggestion = {
      key: AI_COMPANION_ID,
      label: 'AI Companion',
      mentionValue: 'companion',
      isAI: true,
    };

    const includeAI = !q || aiSuggestion.label.toLowerCase().includes(q) || aiSuggestion.mentionValue.includes(q);
    return includeAI ? [...userSuggestions, aiSuggestion] : userSuggestions;
  }, [members, mentionQuery]);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id ?? null));
    hasCircleAIConsent().then(setCircleAIConsented).catch(() => setCircleAIConsented(false));
  }, []);

  useEffect(() => {
    if (!circleId) return;
    let cancelled = false;

    (async () => {
      const [circle, msgs, m, blockedIds] = await Promise.all([
        getCircle(circleId),
        getCircleMessages(circleId),
        getCircleMembers(circleId),
        getBlockedUserIds(),
      ]);
      if (cancelled) return;

      const title = circle?.name ?? name ?? 'Circle';
      setCircleTitle(title);

      setMembers(m);
      membersMapRef.current = new Map(
        m.map((mb) => [mb.userId, { nickname: mb.nickname, avatarUrl: mb.avatarUrl }]),
      );

      blockedUserIdsRef.current = new Set(blockedIds);
      setMessages(msgs.filter((msg) => !blockedUserIdsRef.current.has(msg.senderId)));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    })();

    const unsub = subscribeToCircleMessages(
      circleId,
      (msg) => {
        if (blockedUserIdsRef.current.has(msg.senderId)) return;
        const info = membersMapRef.current.get(msg.senderId);
        const annotated: CircleMessage = info
          ? { ...msg, senderNickname: info.nickname, senderAvatarUrl: info.avatarUrl }
          : msg;
        setMessages((prev) => {
          if (prev.some((m) => m.id === annotated.id)) return prev;
          return [...prev, annotated];
        });
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      },
      (deletedId) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [circleId, name]);

  async function handleSend() {
    if (!input.trim() || !circleId) return;
    const body = input.trim();
    const wantsAI = /@companion\b/i.test(body);

    if (wantsAI && members.length > 1 && !circleAIConsented) {
      pendingAIMessageRef.current = body;
      setShowAIConsentModal(true);
      return;
    }

    const filterResult = filterContent(body);
    if (filterResult.ok === false) {
      Alert.alert(t('circle.messageBlocked'), filterResult.reason);
      return;
    }
    if (filterResult.ok === 'warn') {
      Alert.alert(
        t('circle.strongLanguage'),
        filterResult.reason,
        [
          { text: t('circle.editMessage'), style: 'cancel' },
          { text: t('circle.sendAnyway'), onPress: () => doSend(body) },
        ],
      );
      return;
    }
    doSend(body);
  }

  async function doSend(body: string) {
    const wantsAI = /@companion\b/i.test(body);
    setInput('');
    setSending(true);

    if (containsCrisisKeywords(body)) setShowCrisisBanner(true);

    const msg = await sendCircleMessage(circleId!, body, name);
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
    setSending(false);

    if (wantsAI) {
      if (members.length <= 1) {
        Alert.alert(t('circle.aiUnavailable'), t('circle.aiUnavailableMembers'));
        return;
      }
      if (!msg) {
        Alert.alert(t('circle.aiUnavailable'), t('circle.aiUnavailableSend'));
        return;
      }
      await handleCompanionReply(msg.id);
    }
  }

  async function handleCompanionReply(triggerMessageId: string) {
    if (!circleId) return;

    setAiLoading(true);
    const { message, error } = await sendCircleAIMessage(circleId, triggerMessageId);
    setAiLoading(false);

    if (error) {
      Alert.alert(t('circle.aiUnavailable'), error);
      return;
    }

    if (!message) return;

    setMessages((prev) => (prev.some((existing) => existing.id === message.id) ? prev : [...prev, message]));
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }

  async function handleGrantAIConsent() {
    await grantCircleAIConsent();
    setCircleAIConsented(true);
    setShowAIConsentModal(false);

    const pendingMessage = pendingAIMessageRef.current;
    pendingAIMessageRef.current = null;
    if (!pendingMessage) return;

    await doSend(pendingMessage);
  }

  function handleDenyAIConsent() {
    pendingAIMessageRef.current = null;
    setShowAIConsentModal(false);
  }

  function handleMentionSelect(suggestion: MentionSuggestion) {
    setInput((prev) => prev.replace(/(?:^|\s)@[\w.-]*$/, (m) => `${m.startsWith(' ') ? ' ' : ''}@${suggestion.mentionValue} `));
  }

  function handleOptions() {
    const options = [t('circle.reportCircle'), t('circle.leaveCircle'), t('common.cancel')];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) promptReportCircle();
          if (idx === 1) confirmLeave();
        },
      );
    } else {
      Alert.alert(t('circle.options'), undefined, [
        { text: t('circle.reportCircle'), onPress: promptReportCircle },
        { text: t('circle.leaveCircle'), style: 'destructive', onPress: confirmLeave },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }

  async function handleBlockMember(member: CircleMember) {
    const ok = await blockUser(member.userId);
    if (!ok) {
      Alert.alert(t('circle.blockFailed'), t('circle.connectionError'));
      return;
    }

    blockedUserIdsRef.current = new Set([...blockedUserIdsRef.current, member.userId]);
    setMessages((prev) => prev.filter((message) => message.senderId !== member.userId));
    Alert.alert(t('circle.blocked'), t('circle.blockedBody'));
  }

  async function handleReportMember(member: CircleMember) {
    if (!circleId) return;

    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('circle.reportMember'),
        t('circle.reportMemberPrompt'),
        async (reason) => {
          if (!reason?.trim()) return;
          await reportInCircle(circleId, reason.trim(), { reportedUserId: member.userId });
          Alert.alert(t('circle.reported'), t('circle.reportedBody'));
        },
        'plain-text',
      );
      return;
    }

    Alert.alert(
      t('circle.reportMember'),
      t('circle.reportMemberBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('circle.report'),
          onPress: async () => {
            await reportInCircle(circleId, 'Reported from member list', {
              reportedUserId: member.userId,
            });
            Alert.alert(t('circle.reported'), t('circle.reportedBody'));
          },
        },
      ]
    );
  }

  async function handleKickMember(member: CircleMember) {
    if (!circleId) return;

    Alert.alert(
      t('circle.removeMember', { name: member.nickname }),
      t('circle.removeMemberBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('circle.removeMemberBtn'),
          style: 'destructive',
          onPress: async () => {
            const ok = await kickCircleMember(circleId, member.userId);
            if (!ok) {
              Alert.alert(t('circle.removeMemberFailed'), t('circle.removeMemberFailedBody'));
              return;
            }
            setMembers((prev) => prev.filter((item) => item.userId !== member.userId));
            Alert.alert(t('circle.removed'), t('circle.removedBody'));
          },
        },
      ]
    );
  }

  function confirmLeave() {
    Alert.alert(
      t('circle.leaveTitle'),
      t('circle.leaveBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('circle.leave'),
          style: 'destructive',
          onPress: async () => {
            if (!circleId) return;
            const ok = await leaveCircle(circleId);
            if (!ok) {
              Alert.alert(t('circle.couldNotLeave'), t('circle.tryAgain'));
              return;
            }
            router.back();
          },
        },
      ],
    );
  }

  function promptReportCircle() {
    if (!circleId) return;

    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('circle.reportCircle'),
        t('circle.reportCirclePrompt'),
        async (reason) => {
          if (!reason?.trim()) return;
          await reportInCircle(circleId, reason.trim());
          Alert.alert(t('circle.reported'), t('circle.reportedBody'));
        },
        'plain-text',
      );
      return;
    }

    Alert.alert(t('circle.reportCircle'), t('circle.reportCircleBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('circle.report'),
        onPress: async () => {
          await reportInCircle(circleId, 'Reported from circle options');
          Alert.alert(t('circle.reported'), t('circle.reportedBody'));
        },
      },
    ]);
  }

  function promptDeleteMessage(message: CircleMessage) {
    Alert.alert(
      t('circle.deleteMessage'),
      t('circle.deleteMessageBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteCircleMessage(message.id);
            if (ok) {
              setMessages((prev) => prev.filter((m) => m.id !== message.id));
            } else {
              Alert.alert(t('circle.deleteFailed'), t('circle.connectionError'));
            }
          },
        },
      ],
    );
  }

  function promptReportMessage(message: CircleMessage) {
    if (message.senderId === myUserId) return;

    const doBlock = async () => {
      const ok = await blockUser(message.senderId);
      if (!ok) {
        Alert.alert(t('circle.blockFailed'), t('circle.connectionError'));
        return;
      }
      if (circleId) {
        await reportInCircle(circleId, 'Blocked from circle', {
          messageId: message.id,
          reportedUserId: message.senderId,
        });
      }
      Alert.alert(t('circle.blocked'), t('circle.blockedFullBody'));
    };

    const doReport = () => {
      if (Platform.OS === 'ios') {
        Alert.prompt(
          t('circle.reportMessage'),
          t('circle.reportMessagePrompt'),
          async (reason) => {
            if (!reason?.trim() || !circleId) return;
            await reportInCircle(circleId, reason.trim(), {
              messageId: message.id,
              reportedUserId: message.senderId,
            });
            Alert.alert(t('circle.reported'), t('circle.reportedBody'));
          },
          'plain-text',
        );
      } else {
        Alert.alert(
          t('circle.reportMessage'),
          t('circle.reportMessageBody'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('circle.report'),
              onPress: async () => {
                if (!circleId) return;
                await reportInCircle(circleId, 'Reported from circle', {
                  messageId: message.id,
                  reportedUserId: message.senderId,
                });
                Alert.alert(t('circle.reported'), t('circle.reportedBody'));
              },
            },
          ],
        );
      }
    };

    const options = [t('circle.blockMember'), t('circle.reportMsg'), t('common.cancel')];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 0, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) doBlock();
          if (idx === 1) doReport();
        },
      );
    } else {
      Alert.alert(t('circle.options'), undefined, [
        { text: t('circle.blockMember'), style: 'destructive', onPress: doBlock },
        { text: t('circle.reportMsg'), onPress: doReport },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }

  return (
    <View style={styles.safeWrapper}>
    <SafeAreaView style={styles.safe}>
      <Modal
        visible={showAIConsentModal}
        transparent
        animationType="fade"
        onRequestClose={handleDenyAIConsent}
      >
        <View style={styles.consentOverlay}>
          <View style={styles.consentCard}>
            <View style={styles.consentHeader}>
              <Ionicons name="sparkles" size={20} color={Colors.mutedLavender} />
              <Text style={styles.consentTitle}>{t('circle.aiConsentTitle')}</Text>
            </View>
            <ScrollView style={styles.consentScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.consentBody}>{t('circle.aiConsentBody')}</Text>
              <Text style={styles.consentSectionLabel}>{t('circle.aiConsentWhatShared')}</Text>
              <Text style={styles.consentBody}>{t('circle.aiConsentSharedItems')}</Text>
              <Text style={styles.consentSectionLabel}>{t('circle.aiConsentImportant')}</Text>
              <Text style={styles.consentBody}>{t('circle.aiConsentDisclaimer')}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.consentAgreeBtn} onPress={handleGrantAIConsent}>
              <Text style={styles.consentAgreeBtnText}>{t('circle.aiConsentAgree')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.consentDenyBtn} onPress={handleDenyAIConsent}>
              <Text style={styles.consentDenyBtnText}>{t('circle.aiConsentDeny')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navCenter}
          onPress={() => setShowMembers(true)}
          accessibilityLabel="View circle members"
        >
          <View style={styles.navAvatar}>
            <Ionicons name="people" size={18} color={Colors.white} />
          </View>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={styles.navName} numberOfLines={1}>
              {circleTitle}
            </Text>
            {members.length > 0 && (
              <Text style={styles.navMemberCount}>{t('circle.memberCount', { count: members.length })}</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleOptions} style={styles.navBtn} accessibilityLabel="Circle options">
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.safetyBanner}>
        <Ionicons name="shield-checkmark-outline" size={14} color={Colors.softGreen} />
        <Text style={styles.safetyText}>{t('circle.safetyBanner')}</Text>
      </View>

      <View style={styles.aiBanner}>
        <Ionicons name="sparkles-outline" size={14} color={Colors.mutedLavender} />
        <Text style={styles.aiBannerText}>
          {t('circle.aiBanner')} {AI_DISCLAIMER}
        </Text>
      </View>

      {showCrisisBanner && (
        <View style={styles.crisisBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.alertRed} />
          <Text style={styles.crisisText} numberOfLines={3}>
            {CRISIS_HOTLINE}
          </Text>
          <TouchableOpacity onPress={() => setShowCrisisBanner(false)} accessibilityLabel="Dismiss crisis banner">
            <Ionicons name="close" size={16} color={Colors.alertRed} />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={buildListItems(messages, t)}
          keyExtractor={(item) => item.type === 'date' ? item.key : item.data.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            if (item.type === 'date') return <DateSeparator label={item.label} />;
            return (
              <MessageBubble
                message={item.data}
                isMe={item.data.senderId === myUserId}
                isAIMessage={item.data.isAI === true}
                onLongPress={() =>
                  item.data.isAI
                    ? undefined
                    : item.data.senderId === myUserId
                    ? promptDeleteMessage(item.data)
                    : promptReportMessage(item.data)
                }
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('circle.noMessages')}</Text>
          }
          ListFooterComponent={
            aiLoading ? (
              <View style={styles.aiThinkingRow}>
                <ActivityIndicator size="small" color={Colors.mutedLavender} />
                <Text style={styles.aiThinkingText}>{t('circle.aiThinking')}</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('circle.inputPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            accessibilityLabel="Message input"
            testID="circle-message-input"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            accessibilityLabel="Send message"
            testID="circle-send-btn"
          >
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {mentionQuery !== null && mentionSuggestions.length > 0 && (
          <View style={styles.mentionsPanel}>
            {mentionSuggestions.slice(0, 8).map((suggestion) => (
              <TouchableOpacity
                key={suggestion.key}
                style={styles.mentionRow}
                onPress={() => handleMentionSelect(suggestion)}
                accessibilityLabel={`Mention ${suggestion.label}`}
              >
                <View style={styles.mentionIconWrap}>
                  <Ionicons
                    name={suggestion.isAI ? 'sparkles' : 'at'}
                    size={14}
                    color={suggestion.isAI ? Colors.mutedLavender : Colors.textMuted}
                  />
                </View>
                <Text style={styles.mentionLabel}>@{suggestion.mentionValue}</Text>
                {suggestion.mentionValue !== suggestion.label && (
                  <Text style={styles.mentionMeta}>{suggestion.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </KeyboardAvoidingView>

      {showMembers && (
        <View style={styles.membersOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowMembers(false)}
            activeOpacity={1}
            accessibilityLabel="Close members"
          />
          <View style={styles.membersSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('circle.membersTitle')}</Text>
              <View style={styles.memberCountBadge}>
                <Text style={styles.memberCountText}>{members.length}</Text>
              </View>
            </View>
            <FlatList
              data={[...members].sort((a) => (a.isMe ? -1 : 1))}
              keyExtractor={(m) => m.userId}
              contentContainerStyle={styles.memberList}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <MemberAvatar nickname={item.nickname} avatarUrl={item.avatarUrl} size={44} />
                  <View style={styles.memberBody}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {item.nickname}
                      </Text>
                      {item.role === 'moderator' && (
                        <View style={styles.modBadge}>
                          <Text style={styles.modBadgeText}>mod</Text>
                        </View>
                      )}
                    </View>
                    {item.isMe && <Text style={styles.memberMeta}>{t('circle.youLabel')}</Text>}
                  </View>
                  {item.isMe ? (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>{t('circle.youBadge')}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.memberMenuBtn}
                      onPress={() => {
                        const canKick = members.some((m) => m.isMe && m.role === 'moderator');
                        const options = canKick
                          ? [t('circle.blockMember'), t('circle.reportMember'), t('circle.removeMemberBtn'), t('common.cancel')]
                          : [t('circle.blockMember'), t('circle.reportMember'), t('common.cancel')];
                        const cancelButtonIndex = options.length - 1;
                        const destructiveButtonIndex = 0;

                        const onSelect = (idx: number) => {
                          if (idx === 0) handleBlockMember(item);
                          if (idx === 1) handleReportMember(item);
                          if (canKick && idx === 2) handleKickMember(item);
                        };

                        if (Platform.OS === 'ios') {
                          ActionSheetIOS.showActionSheetWithOptions(
                            {
                              options,
                              cancelButtonIndex,
                              destructiveButtonIndex,
                            },
                            onSelect,
                          );
                        } else {
                          Alert.alert(t('circle.memberOptions'), undefined, [
                            { text: t('circle.blockMember'), style: 'destructive', onPress: () => handleBlockMember(item) },
                            { text: t('circle.reportMember'), onPress: () => handleReportMember(item) },
                            ...(canKick
                              ? [{ text: t('circle.removeMemberBtn'), style: 'destructive' as const, onPress: () => handleKickMember(item) }]
                              : []),
                            { text: t('common.cancel'), style: 'cancel' },
                          ]);
                        }
                      }}
                      accessibilityLabel={`Member actions for ${item.nickname}`}
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
    </View>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.dateSepRow}>
      <View style={styles.dateSepLine} />
      <Text style={styles.dateSepText}>{label}</Text>
      <View style={styles.dateSepLine} />
    </View>
  );
}

function MemberAvatar({
  nickname,
  avatarUrl,
  size = 32,
  style,
}: {
  nickname: string;
  avatarUrl?: string;
  size?: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.mutedLavender + '40',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      ) : (
        <Text
          style={{ fontSize: size * 0.42, fontWeight: '700', color: Colors.mutedLavender }}
        >
          {(nickname?.[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function MessageBubble({
  message,
  isMe,
  isAIMessage,
  onLongPress,
}: {
  message: CircleMessage;
  isMe: boolean;
  isAIMessage: boolean;
  onLongPress?: () => void;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const name = message.senderNickname ?? 'Someone';
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      {!isMe && (
        <MemberAvatar
          nickname={name}
          avatarUrl={message.senderAvatarUrl}
          size={28}
          style={styles.bubbleAvatar}
        />
      )}
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={0.85}
        disabled={!onLongPress}
        style={[styles.bubble, isMe ? styles.bubbleMe : isAIMessage ? styles.bubbleAI : styles.bubbleThem]}
        accessibilityLabel={isAIMessage
          ? 'AI Companion message'
          : isMe
            ? 'Your message, long press to delete'
            : `Message from ${name}, long press to report`}
      >
        {!isMe && <Text style={[styles.bubbleSender, isAIMessage && styles.bubbleSenderAI]}>{name}</Text>}
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeWrapper: { flex: 1, backgroundColor: Colors.warmWhite },
  safe: { flex: 1 },
  flex: { flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: { padding: Spacing.xs, minWidth: 32 },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, justifyContent: 'center' },
  navAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.mutedLavender,
    alignItems: 'center', justifyContent: 'center',
  },
  navName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, maxWidth: 200 },
  navMemberCount: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  safetyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.softGreen + '18',
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  safetyText: { fontSize: 12, color: Colors.softGreen, fontWeight: '600' },
  aiBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.mutedLavender + '14',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  aiBannerText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  crisisBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.alertRed + '12',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.alertRed,
  },
  crisisText: { flex: 1, fontSize: 12, color: Colors.alertRed, lineHeight: 18 },
  messageList: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  dateSepRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.md, gap: Spacing.sm,
  },
  dateSepLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateSepText: {
    fontSize: 11, color: Colors.textMuted,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl * 2, fontSize: 14 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleAvatar: { marginRight: 6, marginBottom: 2 },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  bubbleMe: { backgroundColor: Colors.safeBlue, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: Colors.mutedLavender + '18', borderBottomLeftRadius: 4 },
  bubbleThem: { backgroundColor: Colors.softGray, borderBottomLeftRadius: 4 },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: Colors.mutedLavender, marginBottom: 2 },
  bubbleSenderAI: { color: Colors.safeBlue },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextMe: { color: Colors.white },
  bubbleTime: { fontSize: 11, color: Colors.textMuted, alignSelf: 'flex-end', marginTop: 2 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)' },
  aiThinkingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  aiThinkingText: { fontSize: 13, color: Colors.textMuted },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.warmWhite,
  },
  input: {
    flex: 1, fontSize: 15, color: Colors.textPrimary,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  mentionsPanel: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.softGray,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    gap: 2,
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
  },
  mentionIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warmWhite,
  },
  mentionLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  mentionMeta: { fontSize: 12, color: Colors.textMuted },
  consentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  consentCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  consentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  consentTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  consentScroll: { maxHeight: 280 },
  consentSectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
  consentBody: { fontSize: 14, lineHeight: 20, color: Colors.textSecondary },
  consentAgreeBtn: {
    backgroundColor: Colors.safeBlue,
    borderRadius: Radius.lg,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  consentAgreeBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  consentDenyBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  consentDenyBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  // ── Members bottom sheet ──────────────────────────────────
  membersOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.62)',
    zIndex: 999,
  },
  membersSheet: {
    backgroundColor: Colors.softGray,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '78%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  memberCountBadge: {
    backgroundColor: Colors.mutedLavender + '30',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  memberCountText: { fontSize: 13, fontWeight: '700', color: Colors.mutedLavender },
  memberList: { padding: Spacing.md, gap: Spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberBody: { flex: 1, gap: 3 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { flexShrink: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  memberMeta: { fontSize: 12, color: Colors.textMuted },
  modBadge: {
    backgroundColor: Colors.safeBlue + '16',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  modBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.safeBlue, textTransform: 'uppercase' },
  youBadge: {
    backgroundColor: Colors.mutedLavender + '25',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  youBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.mutedLavender },
  memberMenuBtn: { padding: Spacing.xs },
});

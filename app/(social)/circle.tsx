import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { containsCrisisKeywords } from '@/services/social/chat';
import {
    deleteCircleMessage,
    getCircleMembers,
    getCircleMessages,
    leaveCircle,
    reportInCircle,
    sendCircleMessage,
    subscribeToCircleMessages,
} from '@/services/social/circles';
import { blockUser } from '@/services/social/matching';
import { filterContent } from '@/services/social/contentFilter';
import { supabase } from '@/services/supabase';
import type { CircleMember, CircleMessage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const CRISIS_HOTLINE =
  'Trevor Project (LGBTQ+): 1-866-488-7386\nCrisis Text Line: text HOME to 741741';

type ListItem =
  | { type: 'message'; data: CircleMessage }
  | { type: 'date'; label: string; key: string };

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDayLabel(date: Date): string {
  const now = new Date();
  const todayKey = dayKey(now);
  const msgKey = dayKey(date);
  const diffMs =
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (msgKey === todayKey) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildListItems(messages: CircleMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let lastKey = '';
  for (const msg of messages) {
    const date = new Date(msg.createdAt);
    const key = dayKey(date);
    if (key !== lastKey) {
      items.push({ type: 'date', label: formatDayLabel(date), key: `date-${key}` });
      lastKey = key;
    }
    items.push({ type: 'message', data: msg });
  }
  return items;
}

export default function CircleChatScreen() {
  const { circleId, name } = useLocalSearchParams<{ circleId: string; name: string }>();
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [input, setInput] = useState('');
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const membersMapRef = useRef<Map<string, { nickname: string; avatarUrl?: string }>>(new Map());
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!circleId) return;
    getCircleMessages(circleId).then((msgs) => {
      setMessages(msgs);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    });
    getCircleMembers(circleId).then((m) => {
      setMembers(m);
      membersMapRef.current = new Map(
        m.map((mb) => [mb.userId, { nickname: mb.nickname, avatarUrl: mb.avatarUrl }]),
      );
    });

    const unsub = subscribeToCircleMessages(circleId, (msg) => {
      const info = membersMapRef.current.get(msg.senderId);
      const annotated: CircleMessage = info
        ? { ...msg, senderNickname: info.nickname, senderAvatarUrl: info.avatarUrl }
        : msg;
      setMessages((prev) => {
        if (prev.some((m) => m.id === annotated.id)) return prev;
        return [...prev, annotated];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return unsub;
  }, [circleId]);

  async function handleSend() {
    if (!input.trim() || !circleId) return;
    const body = input.trim();
    const filterResult = filterContent(body);
    if (filterResult.ok === false) {
      Alert.alert('Message blocked', filterResult.reason);
      return;
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

    const msg = await sendCircleMessage(circleId!, body);
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
    setSending(false);
  }

  function handleOptions() {
    const options = ['Report this circle', 'Leave circle', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) promptReportCircle();
          if (idx === 1) confirmLeave();
        },
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Report this circle', onPress: promptReportCircle },
        { text: 'Leave circle', style: 'destructive', onPress: confirmLeave },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  function confirmLeave() {
    Alert.alert(
      'Leave this circle?',
      'You won\'t receive new messages. You can rejoin later if there\'s space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!circleId) return;
            const ok = await leaveCircle(circleId);
            if (!ok) {
              Alert.alert('Could not leave', 'Please try again.');
              return;
            }
            router.back();
          },
        },
      ],
    );
  }

  function promptReportCircle() {
    Alert.prompt(
      'Report this circle',
      'Briefly describe the issue (e.g. harassment, unsafe content):',
      async (reason) => {
        if (!reason?.trim() || !circleId) return;
        await reportInCircle(circleId, reason.trim());
        Alert.alert('Reported', 'Thank you. We\'ll review this shortly.');
      },
      'plain-text',
    );
  }

  function promptDeleteMessage(message: CircleMessage) {
    Alert.alert(
      'Delete message?',
      'This will remove your message for everyone in the circle.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteCircleMessage(message.id);
            if (ok) {
              setMessages((prev) => prev.filter((m) => m.id !== message.id));
            } else {
              Alert.alert('Delete failed', 'Please check your connection and try again.');
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
        Alert.alert('Block failed', 'Please check your connection and try again.');
        return;
      }
      if (circleId) {
        await reportInCircle(circleId, 'Blocked from circle', {
          messageId: message.id,
          reportedUserId: message.senderId,
        });
      }
      Alert.alert('Blocked', 'This member has been blocked. You will no longer see their messages.');
    };

    const doReport = () => {
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Report this message',
          'Briefly describe the issue:',
          async (reason) => {
            if (!reason?.trim() || !circleId) return;
            await reportInCircle(circleId, reason.trim(), {
              messageId: message.id,
              reportedUserId: message.senderId,
            });
            Alert.alert('Reported', 'Thank you. We\'ll review this shortly.');
          },
          'plain-text',
        );
      } else {
        Alert.alert(
          'Report this message',
          'This message will be reviewed by our team.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Report',
              onPress: async () => {
                if (!circleId) return;
                await reportInCircle(circleId, 'Reported from circle', {
                  messageId: message.id,
                  reportedUserId: message.senderId,
                });
                Alert.alert('Reported', 'Thank you. We\'ll review this shortly.');
              },
            },
          ],
        );
      }
    };

    const options = ['Block this member', 'Report message', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 0, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) doBlock();
          if (idx === 1) doReport();
        },
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Block this member', style: 'destructive', onPress: doBlock },
        { text: 'Report message', onPress: doReport },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  return (
    <View style={styles.safeWrapper}>
    <SafeAreaView style={styles.safe}>
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
              {name ?? 'Circle'}
            </Text>
            {members.length > 0 && (
              <Text style={styles.navMemberCount}>{members.length} members</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleOptions} style={styles.navBtn} accessibilityLabel="Circle options">
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.safetyBanner}>
        <Ionicons name="shield-checkmark-outline" size={14} color={Colors.softGreen} />
        <Text style={styles.safetyText}>You can block, leave or report anytime.</Text>
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
          data={buildListItems(messages)}
          keyExtractor={(item) => item.type === 'date' ? item.key : item.data.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            if (item.type === 'date') return <DateSeparator label={item.label} />;
            return (
              <MessageBubble
                message={item.data}
                isMe={item.data.senderId === myUserId}
                onLongPress={() =>
                  item.data.senderId === myUserId
                    ? promptDeleteMessage(item.data)
                    : promptReportMessage(item.data)
                }
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages yet. Be the first to share.</Text>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Share with the circle…"
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
              <Text style={styles.modalTitle}>Members</Text>
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
                  <Text style={styles.memberName} numberOfLines={1}>
                    {item.nickname}
                  </Text>
                  {item.isMe && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>you</Text>
                    </View>
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
  onLongPress,
}: {
  message: CircleMessage;
  isMe: boolean;
  onLongPress: () => void;
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
        style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
        accessibilityLabel={isMe ? 'Your message, long press to delete' : `Message from ${name}, long press to report`}
      >
        {!isMe && <Text style={styles.bubbleSender}>{name}</Text>}
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
  bubbleThem: { backgroundColor: Colors.softGray, borderBottomLeftRadius: 4 },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: Colors.mutedLavender, marginBottom: 2 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextMe: { color: Colors.white },
  bubbleTime: { fontSize: 11, color: Colors.textMuted, alignSelf: 'flex-end', marginTop: 2 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)' },
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
  memberName: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  youBadge: {
    backgroundColor: Colors.mutedLavender + '25',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  youBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.mutedLavender },
});

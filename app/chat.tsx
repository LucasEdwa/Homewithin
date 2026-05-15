import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { sendMessage, getMessages, subscribeToMessages, containsCrisisKeywords } from '@/services/chat';
import { blockUser, reportMessage, getMatchPeerId } from '@/services/matching';
import { supabase } from '@/services/supabase';
import type { Message } from '@/types';

const CRISIS_HOTLINE = 'Trevor Project (LGBTQ+): 1-866-488-7386\nCrisis Text Line: text HOME to 741741';

export default function ChatScreen() {
  const { matchId, nickname } = useLocalSearchParams<{ matchId: string; nickname: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [disappearing, setDisappearing] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!matchId) return;
    getMessages(matchId).then((msgs) => {
      setMessages(msgs);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    });

    const unsub = subscribeToMessages(matchId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return unsub;
  }, [matchId]);

  async function handleSend() {
    if (!input.trim() || !matchId) return;
    const body = input.trim();
    setInput('');
    setSending(true);

    if (containsCrisisKeywords(body)) setShowCrisisBanner(true);

    const msg = await sendMessage(matchId, body, disappearing);
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
    setSending(false);
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

  function confirmBlock() {
    Alert.alert(
      'Block this person?',
      'They won\'t be able to contact you. This cannot be undone.',
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

            // Prefer the match row (works even if they never sent a message);
            // fall back to messages if for some reason the lookup fails.
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
          Alert.alert('Reported', 'Thank you. We\'ll review this shortly.');
        }
      },
      'plain-text'
    );
  }

  const isExpired = (msg: Message) =>
    !!msg.expiresAt && new Date(msg.expiresAt) < new Date();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <View style={styles.navAvatar}>
            <Text style={styles.navAvatarText}>{(nickname?.[0] ?? '?').toUpperCase()}</Text>
          </View>
          <Text style={styles.navName}>{nickname ?? 'Chat'}</Text>
        </View>
        <TouchableOpacity onPress={handleOptions} style={styles.navBtn} accessibilityLabel="Options">
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Safety banner */}
      <View style={styles.safetyBanner}>
        <Ionicons name="shield-checkmark-outline" size={14} color={Colors.softGreen} />
        <Text style={styles.safetyText}>You can block or report anytime.</Text>
      </View>

      {/* Crisis banner */}
      {showCrisisBanner && (
        <View style={styles.crisisBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.alertRed} />
          <Text style={styles.crisisText} numberOfLines={3}>{CRISIS_HOTLINE}</Text>
          <TouchableOpacity onPress={() => setShowCrisisBanner(false)} accessibilityLabel="Dismiss crisis banner">
            <Ionicons name="close" size={16} color={Colors.alertRed} />
          </TouchableOpacity>
        </View>
      )}

      {/* Message list */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages.filter((m) => !isExpired(m))}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMe={item.senderId === myUserId}
              disappearing={!!item.expiresAt}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          }
        />

        {/* Disappearing toggle */}
        <TouchableOpacity
          style={[styles.disappearToggle, disappearing && styles.disappearToggleActive]}
          onPress={() => setDisappearing((d) => !d)}
          accessibilityLabel={disappearing ? 'Disappearing messages on (24h)' : 'Disappearing messages off'}
        >
          <Ionicons
            name={disappearing ? 'timer' : 'timer-outline'}
            size={15}
            color={disappearing ? Colors.safeBlue : Colors.textMuted}
          />
          <Text style={[styles.disappearText, disappearing && styles.disappearTextActive]}>
            {disappearing ? '24h · on' : '24h off'}
          </Text>
        </TouchableOpacity>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            accessibilityLabel="Message input"
            testID="message-input"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            accessibilityLabel="Send message"
            testID="send-btn"
          >
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  isMe,
  disappearing,
}: {
  message: Message;
  isMe: boolean;
  disappearing: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.body}</Text>
        <View style={styles.bubbleMeta}>
          {disappearing && (
            <Ionicons name="timer-outline" size={11} color={isMe ? 'rgba(255,255,255,0.6)' : Colors.textMuted} />
          )}
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
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
  navBtn: { padding: Spacing.xs },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  navAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAvatarText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  navName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.softGreen + '18',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  safetyText: { fontSize: 12, color: Colors.softGreen, fontWeight: '600' },
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.alertRed + '12',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.alertRed,
  },
  crisisText: { flex: 1, fontSize: 12, color: Colors.alertRed, lineHeight: 18 },
  messageList: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl * 2, fontSize: 14 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  bubbleMe: { backgroundColor: Colors.safeBlue, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.softGray, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextMe: { color: Colors.white },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end' },
  bubbleTime: { fontSize: 11, color: Colors.textMuted },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)' },
  disappearToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginHorizontal: Spacing.md,
    marginBottom: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.softGray,
  },
  disappearToggleActive: { backgroundColor: Colors.safeBlue + '18' },
  disappearText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  disappearTextActive: { color: Colors.safeBlue },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});

import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { containsCrisisKeywords } from '@/services/social/chat';
import {
    getCircleMessages,
    leaveCircle,
    reportInCircle,
    sendCircleMessage,
    subscribeToCircleMessages,
} from '@/services/social/circles';
import { supabase } from '@/services/supabase';
import type { CircleMessage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
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

export default function CircleChatScreen() {
  const { circleId, name } = useLocalSearchParams<{ circleId: string; name: string }>();
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [input, setInput] = useState('');
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
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

    const unsub = subscribeToCircleMessages(circleId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return unsub;
  }, [circleId]);

  async function handleSend() {
    if (!input.trim() || !circleId) return;
    const body = input.trim();
    setInput('');
    setSending(true);

    if (containsCrisisKeywords(body)) setShowCrisisBanner(true);

    const msg = await sendCircleMessage(circleId, body);
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

  function promptReportMessage(message: CircleMessage) {
    if (message.senderId === myUserId) return;
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
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <View style={styles.navAvatar}>
            <Ionicons name="people" size={18} color={Colors.white} />
          </View>
          <Text style={styles.navName} numberOfLines={1}>
            {name ?? 'Circle'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleOptions} style={styles.navBtn} accessibilityLabel="Circle options">
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.safetyBanner}>
        <Ionicons name="shield-checkmark-outline" size={14} color={Colors.softGreen} />
        <Text style={styles.safetyText}>You can leave or report anytime.</Text>
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
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMe={item.senderId === myUserId}
              onLongPress={() => promptReportMessage(item)}
            />
          )}
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
    </SafeAreaView>
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
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={0.85}
        style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
        accessibilityLabel={isMe ? 'Your message' : `Message from ${name}, long press to report`}
      >
        {!isMe && <Text style={styles.bubbleSender}>{name}</Text>}
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
      </TouchableOpacity>
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
  navBtn: { padding: Spacing.xs, minWidth: 32 },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, justifyContent: 'center' },
  navAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.mutedLavender,
    alignItems: 'center', justifyContent: 'center',
  },
  navName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, maxWidth: 200 },
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
  bubbleSender: { fontSize: 11, fontWeight: '700', color: Colors.mutedLavender, marginBottom: 2 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextMe: { color: Colors.white },
  bubbleTime: { fontSize: 11, color: Colors.textMuted, alignSelf: 'flex-end', marginTop: 2 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.white,
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
});

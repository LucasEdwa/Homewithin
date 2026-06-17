import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useCountdown } from '@/hooks/useCountdown';
import { EXPIRY_OPTIONS, useChatScreen } from '@/hooks/useChatScreen';
import type { Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useRef } from 'react';
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const CRISIS_HOTLINE = 'Trevor Project (LGBTQ+): 1-866-488-7386\nCrisis Text Line: text HOME to 741741';
const REPLY_THRESHOLD = 64;

export default function ChatScreen() {
  const {
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
  } = useChatScreen();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <View style={styles.navAvatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.navAvatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.navAvatarText}>{(nickname?.[0] ?? '?').toUpperCase()}</Text>
            )}
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
          data={listItems}
          keyExtractor={(item) => item.type === 'message' ? item.data.id : item.key}
          style={styles.flatList}
          contentContainerStyle={styles.messageList}
          inverted
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          renderItem={({ item }) => {
            if (item.type === 'dateHeader') {
              return (
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText}>{item.label}</Text>
                </View>
              );
            }
            if (item.type === 'unreadSeparator') {
              return (
                <View style={styles.unreadSep}>
                  <View style={styles.unreadSepLine} />
                  <Text style={styles.unreadSepText}>
                    {item.count === 1 ? '1 unread message' : `${item.count} unread messages`}
                  </Text>
                  <View style={styles.unreadSepLine} />
                </View>
              );
            }
            const isMe = item.data.senderId === myUserId;
            return (
              <MessageBubble
                message={item.data}
                isMe={isMe}
                disappearing={!!item.data.expiresAt}
                onLike={() => handleLike(item.data)}
                onReply={() => setReplyTo(item.data)}
                onLongPress={() => {
                  if (isMe) {
                    const options = ['Copy', 'Delete', 'Cancel'];
                    if (Platform.OS === 'ios') {
                      ActionSheetIOS.showActionSheetWithOptions(
                        { options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
                        (idx) => {
                          if (idx === 0) Clipboard.setStringAsync(item.data.body);
                          if (idx === 1) handleDeleteMessage(item.data.id);
                        },
                      );
                    } else {
                      Alert.alert('Message', undefined, [
                        { text: 'Copy', onPress: () => Clipboard.setStringAsync(item.data.body) },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(item.data.id) },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    }
                  } else {
                    if (Platform.OS === 'ios') {
                      ActionSheetIOS.showActionSheetWithOptions(
                        { options: ['Copy', 'Cancel'], cancelButtonIndex: 1 },
                        (idx) => { if (idx === 0) Clipboard.setStringAsync(item.data.body); },
                      );
                    } else {
                      Alert.alert('Message', undefined, [
                        { text: 'Copy', onPress: () => Clipboard.setStringAsync(item.data.body) },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    }
                  }
                }}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          }
        />

        {/* Auto-delete duration picker */}
        <TouchableOpacity
          style={[styles.disappearToggle, expiryHours != null && styles.disappearToggleActive]}
          onPress={handlePickExpiry}
          accessibilityLabel={expiryHours != null ? `Auto-delete: ${EXPIRY_OPTIONS.find((o) => o.hours === expiryHours)?.label ?? 'on'}` : 'Auto-delete messages off'}
        >
          <Ionicons
            name={expiryHours != null ? 'timer' : 'timer-outline'}
            size={15}
            color={expiryHours != null ? Colors.safeBlue : Colors.textMuted}
          />
          <Text style={[styles.disappearText, expiryHours != null && styles.disappearTextActive]}>
            {expiryHours != null
              ? `${EXPIRY_OPTIONS.find((o) => o.hours === expiryHours)?.label ?? ''} · on`
              : 'Auto-delete off'}
          </Text>
        </TouchableOpacity>

        {/* Reply bar */}
        {replyTo && (
          <View style={styles.replyBar}>
            <Ionicons name="return-down-forward" size={15} color={Colors.safeBlue} />
            <Text style={styles.replyBarText} numberOfLines={1}>{replyTo.body}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)} accessibilityLabel="Cancel reply">
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

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
  onLike,
  onReply,
  onLongPress,
}: {
  message: Message;
  isMe: boolean;
  disappearing: boolean;
  onLike: () => void;
  onReply: () => void;
  onLongPress: () => void;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const countdown = useCountdown(disappearing ? message.expiresAt : undefined);

  // Swipe-to-reply
  // Non-me messages: swipe RIGHT (+translateX), icon appears on the left.
  // Me messages:     swipe LEFT  (-translateX), icon appears on the right.
  const translateX = useSharedValue(0);
  const replyTriggered = useRef(false);
  const dir = isMe ? -1 : 1;

  const swipeGesture = Gesture.Pan()
    .activeOffsetX(isMe ? [-Infinity, -10] : [10, Infinity])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const drag = isMe ? -e.translationX : e.translationX;
      if (drag > 0) {
        translateX.value = dir * Math.min(drag * 0.45, REPLY_THRESHOLD);
        if (drag * 0.45 >= REPLY_THRESHOLD - 2 && !replyTriggered.current) {
          replyTriggered.current = true;
          runOnJS(onReply)();
        }
      }
    })
    .onEnd(() => {
      replyTriggered.current = false;
      translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Reply icon fades in as swipe progresses
  const progress = useAnimatedStyle(() => ({
    opacity: Math.min(Math.abs(translateX.value) / REPLY_THRESHOLD, 1),
    transform: [{ scale: 0.7 + (Math.abs(translateX.value) / REPLY_THRESHOLD) * 0.3 }],
  }));

  // Double-tap to like
  const lastTap = useRef(0);
  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onLike();
    }
    lastTap.current = now;
  }

  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      {/* Reply icon — absolutely positioned so it never shifts the bubble layout */}
      <Animated.View style={[
        styles.replyIconAbs,
        isMe ? styles.replyIconAbsRight : styles.replyIconAbsLeft,
        progress,
      ]}>
        <Ionicons
          name={isMe ? 'return-down-back' : 'return-down-forward'}
          size={18}
          color={Colors.safeBlue}
        />
      </Animated.View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.bubbleCol, isMe && styles.bubbleColMe, animStyle]}>
          {/* Reply quote */}
          {message.replyToBody && (
            <View style={[styles.replyQuote, isMe && styles.replyQuoteMe]}>
              <View style={styles.replyQuoteBar} />
              <Text style={styles.replyQuoteText} numberOfLines={2}>{message.replyToBody}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleDoubleTap}
            onLongPress={onLongPress}
            activeOpacity={0.85}
            accessibilityLabel={isMe ? 'Your message, double-tap to like, long-press to copy or delete' : 'Message, double-tap to like, long-press to copy'}
          >
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.body}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.bubbleMeta}>
            {disappearing && countdown != null && (
              <View style={styles.countdownPill}>
                <Ionicons name="timer-outline" size={11} color={Colors.safetyYellow} />
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
            <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
          </View>

          {/* Like heart badge */}
          {message.liked && (
            <View style={[styles.likeBadge, isMe && styles.likeBadgeMe]}>
              <Text style={styles.likeEmoji}>❤️</Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  flex: { flex: 1, backgroundColor: Colors.warmWhite },
  flatList: { flex: 1, backgroundColor: Colors.warmWhite },
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
  navAvatarImage: { width: 34, height: 34, borderRadius: 17 },
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

  // Bubble rows — column container so alignItems controls left/right without spacers
  bubbleRow: {
    position: 'relative',
    alignItems: 'flex-start',
  },
  bubbleRowMe: { alignItems: 'flex-end' },
  bubbleCol: { maxWidth: '78%', gap: 3, alignItems: 'flex-start' },
  bubbleColMe: { alignItems: 'flex-end' },

  // Reply swipe icons — absolutely positioned so they never affect bubble layout
  replyIconAbs: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyIconAbsLeft: { left: 2 },
  replyIconAbsRight: { right: 2 },

  // Unread separator
  unreadSep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  unreadSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.safeBlue + '55',
  },
  unreadSepText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.safeBlue,
  },

  // Reply quote
  replyQuote: {
    flexDirection: 'row',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    maxWidth: '100%',
    marginBottom: 2,
  },
  replyQuoteMe: { backgroundColor: 'rgba(255,255,255,0.12)' },
  replyQuoteBar: {
    width: 3,
    backgroundColor: Colors.safeBlue,
  },
  replyQuoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    lineHeight: 16,
  },

  // Bubbles
  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  bubbleMe: { backgroundColor: '#2C2724', borderBottomRightRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bubbleThem: { backgroundColor: Colors.softGray, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextMe: { color: Colors.textPrimary },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countdownPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.safetyYellow + '22',
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  countdownText: { fontSize: 10, fontWeight: '700', color: Colors.safetyYellow },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },
  bubbleTimeMe: { color: Colors.textMuted },

  // Like badge
  likeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    backgroundColor: Colors.warmWhite,
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  likeBadgeMe: { left: -5, right: undefined },
  likeEmoji: { fontSize: 13 },

  // Date header
  dateHeader: { alignItems: 'center' as const, marginVertical: Spacing.sm },
  dateHeaderText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    backgroundColor: Colors.softGray,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden' as const,
  },

  // Reply bar above input
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    backgroundColor: Colors.softGray,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyBarText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Auto-delete toggle
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

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.warmWhite,
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

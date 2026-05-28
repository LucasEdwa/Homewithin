import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useCountdown } from '@/hooks/useCountdown';
import { EXPIRY_OPTIONS, useChatScreen } from '@/hooks/useChatScreen';
import type { Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import {
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

const CRISIS_HOTLINE = 'Trevor Project (LGBTQ+): 1-866-488-7386\nCrisis Text Line: text HOME to 741741';

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
    handleSend,
    handlePickExpiry,
    handleOptions,
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
          renderItem={({ item }) => {
            if (item.type === 'dateHeader') {
              return (
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText}>{item.label}</Text>
                </View>
              );
            }
            return (
              <MessageBubble
                message={item.data}
                isMe={item.data.senderId === myUserId}
                disappearing={!!item.data.expiresAt}
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
  const countdown = useCountdown(disappearing ? message.expiresAt : undefined);
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <View style={[styles.bubbleCol, isMe && styles.bubbleColMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.body}</Text>
        </View>
        <View style={styles.bubbleMeta}>
          {disappearing && countdown != null && (
            <View style={styles.countdownPill}>
              <Ionicons name="timer-outline" size={11} color={Colors.safetyYellow} />
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
        </View>
      </View>
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
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleCol: { maxWidth: '78%', gap: 3, alignItems: 'flex-start' },
  bubbleColMe: { alignItems: 'flex-end' },
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
  dateHeader: {
    alignItems: 'center' as const,
    marginVertical: Spacing.sm,
  },
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

import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { EmergencyButton } from '@/components/EmergencyButton';
import {
  sendAIMessage,
  getHistory,
  clearHistory,
  checkRateLimit,
  AI_DISCLAIMER,
} from '@/services/ai';
import type { AIContext } from '@/services/ai';
import type { AIMessage } from '@/types';

const SUGGESTED_STARTERS = [
  'I\'ve been feeling really alone lately.',
  'I want to talk about my family.',
  'Can you help me with a breathing exercise?',
  'I\'m struggling with shame today.',
];

export default function AICompanionScreen() {
  const params = useLocalSearchParams<{ moodScore?: string; journalPreview?: string; context?: string }>();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const aiContext: AIContext = {
    moodScore: params.moodScore ? parseInt(params.moodScore, 10) : undefined,
    journalPreview: params.journalPreview,
  };

  useEffect(() => {
    (async () => {
      const [history, { remaining: rem }] = await Promise.all([getHistory(), checkRateLimit()]);
      setMessages(history);
      setRemaining(rem);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    })();
  }, []);

  async function handleSend(text?: string) {
    const body = (text ?? input).trim();
    if (!body || loading) return;
    setInput('');
    setError(null);
    setLoading(true);

    // Optimistic user message
    const optimistic: AIMessage = {
      id: `user-opt-${Date.now()}`,
      role: 'user',
      body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    const { message, error: err } = await sendAIMessage(body, aiContext);
    setLoading(false);

    if (err) {
      setError(err);
      // Remove optimistic and refresh from history
      const history = await getHistory();
      setMessages(history);
    } else if (message) {
      const history = await getHistory();
      setMessages(history);
      const { remaining: rem } = await checkRateLimit();
      setRemaining(rem);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  async function handleClear() {
    await clearHistory();
    setMessages([]);
    setError(null);
  }

  const showStarters = messages.length === 0 && !loading;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <View style={styles.navIcon}>
            <Ionicons name="sparkles" size={18} color={Colors.mutedLavender} />
          </View>
          <Text style={styles.navTitle}>AI Companion</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.navBtn} accessibilityLabel="Clear conversation">
            <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}>{AI_DISCLAIMER}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            showStarters ? (
              <View style={styles.starters}>
                <Text style={styles.startersTitle}>What's on your mind?</Text>
                {SUGGESTED_STARTERS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.starter}
                    onPress={() => handleSend(s)}
                    testID={`starter-${s.slice(0, 10)}`}
                  >
                    <Text style={styles.starterText}>{s}</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.safeBlue} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListFooterComponent={
            <>
              {loading && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={Colors.mutedLavender} />
                  <Text style={styles.typingText}>Thinking…</Text>
                </View>
              )}
              {error && (
                <Card style={styles.errorCard}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.alertRed} />
                  <Text style={styles.errorText}>{error}</Text>
                </Card>
              )}
              {remaining !== null && remaining <= 5 && remaining > 0 && (
                <Text style={styles.rateNote}>{remaining} message{remaining !== 1 ? 's' : ''} remaining today</Text>
              )}
            </>
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Share what's on your mind…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={800}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            accessibilityLabel="Message input"
            testID="ai-input"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
            accessibilityLabel="Send"
            testID="ai-send-btn"
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color={Colors.mutedLavender} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>{time}</Text>
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
  navBtn: { padding: Spacing.xs, minWidth: 36 },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.mutedLavender + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.softGray,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  list: { padding: Spacing.md, gap: Spacing.md, flexGrow: 1 },
  starters: { gap: Spacing.sm, marginBottom: Spacing.md },
  startersTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  starter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  starterText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  typingText: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.alertRed + '10',
    borderLeftWidth: 3,
    borderLeftColor: Colors.alertRed,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.alertRed },
  rateNote: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.mutedLavender + '22',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  bubbleUser: { backgroundColor: Colors.safeBlue, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.6)' },
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
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.mutedLavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});

import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { getAllProgramsWithProgress } from '@/services/content/programs';
import { getSupportPeople } from '@/services/social/chosenFamily';
import { getMyMatches } from '@/services/social/matching';
import { getCheckIns, getJournalEntries, grantAIConsent, hasAIConsent } from '@/services/storage';
import type { AIContext, UserContext } from '@/services/wellness/ai';
import {
    AI_DISCLAIMER,
    checkRateLimit,
    clearHistory,
    getHistory,
    sendAIMessage
} from '@/services/wellness/ai';
import type { AIMessage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
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

type TFunction = ReturnType<typeof useTranslation>['t'];

function buildPersonalisedStarters(ctx: UserContext, t: TFunction): string[] {
  const defaultStarters = [
    t('aiCompanion.starters.alone'),
    t('aiCompanion.starters.family'),
    t('aiCompanion.starters.breathing'),
    t('aiCompanion.starters.shame'),
  ];
  const starters: string[] = [];

  if (ctx.safetyLevel === 'red' || ctx.safetyLevel === 'yellow') {
    starters.push(t('aiCompanion.personalizedStarters.safetyRed'));
  }
  if (ctx.moodTrend === 'declining') {
    starters.push(t('aiCompanion.personalizedStarters.moodDeclining'));
  }
  if (ctx.recentEmotionTags?.includes('shame')) {
    starters.push(t('aiCompanion.personalizedStarters.shame'));
  }
  if (ctx.recentEmotionTags?.includes('fear')) {
    starters.push(t('aiCompanion.personalizedStarters.fear'));
  }
  if ((ctx.connectionsCount ?? 0) === 0 && (ctx.chosenFamilyCount ?? 0) === 0) {
    starters.push(t('aiCompanion.personalizedStarters.alone'));
  }
  if ((ctx.journalStreak ?? 0) >= 3) {
    starters.push(t('aiCompanion.personalizedStarters.journalStreak', { count: ctx.journalStreak }));
  }

  for (const s of defaultStarters) {
    if (starters.length >= 4) break;
    if (!starters.includes(s)) starters.push(s);
  }

  return starters.slice(0, 4);
}

export default function AICompanionScreen() {
  const { t } = useTranslation();
  const { profile, safetyLevel } = useSession();
  const params = useLocalSearchParams<{ moodScore?: string; journalPreview?: string }>();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [starters, setStarters] = useState<string[]>([
    t('aiCompanion.starters.alone'),
    t('aiCompanion.starters.family'),
    t('aiCompanion.starters.breathing'),
    t('aiCompanion.starters.shame'),
  ]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const listRef = useRef<FlatList>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    (async () => {
      const consented = await hasAIConsent();
      if (!consented) {
        setShowConsentModal(true);
      }

      const [history, { remaining: rem }] = await Promise.all([getHistory(), checkRateLimit()]);
      setMessages(history);
      setRemaining(rem);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);

      // Gather all user data in parallel to build personalized context
      const [checkIns, journalEntries, programs, matches, family] = await Promise.all([
        getCheckIns().catch(() => []),
        getJournalEntries().catch(() => []),
        getAllProgramsWithProgress().catch(() => []),
        getMyMatches().catch(() => []),
        getSupportPeople().catch(() => []),
      ]);

      // Sort check-ins newest first
      const sortedCheckIns = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
      const last7 = sortedCheckIns.slice(0, 7);

      // Mood average (last 7) and trend
      let recentMoodAvg: number | undefined;
      let moodTrend: UserContext['moodTrend'] = null;
      if (last7.length > 0) {
        const avg = last7.reduce((s: number, c: { moodScore: number }) => s + c.moodScore, 0) / last7.length;
        recentMoodAvg = parseFloat(avg.toFixed(1));
        if (last7.length >= 4) {
          const half = Math.floor(last7.length / 2);
          const recentHalf = last7.slice(0, half);
          const olderHalf = last7.slice(half);
          const avgRecent = recentHalf.reduce((s: number, c: { moodScore: number }) => s + c.moodScore, 0) / recentHalf.length;
          const avgOlder = olderHalf.reduce((s: number, c: { moodScore: number }) => s + c.moodScore, 0) / olderHalf.length;
          const delta = avgRecent - avgOlder;
          moodTrend = delta > 0.3 ? 'improving' : delta < -0.3 ? 'declining' : 'stable';
        }
      }

      // Most common emotion tags across all journal entries
      const tagCounts: Record<string, number> = {};
      journalEntries.forEach((e: { emotionTags: string[] }) => {
        e.emotionTags.forEach((t: string) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; });
      });
      const recentEmotionTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag);

      // Journal streak (consecutive days up to today)
      const dateSets = new Set(journalEntries.map((e: { date: string }) => e.date));
      let journalStreak = 0;
      const cursor = new Date();
      while (dateSets.has(cursor.toISOString().split('T')[0])) {
        journalStreak++;
        cursor.setDate(cursor.getDate() - 1);
      }

      // Compact journal summaries for pattern matching (newest first, up to 20)
      const journalSummaries = [...journalEntries]
        .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))
        .slice(0, 20)
        .map((e: { date: string; emotionTags: string[]; body: string }) => ({
          date: e.date,
          tags: e.emotionTags,
          snippet: e.body.slice(0, 150).replace(/\n/g, ' '),
        }));

      // Full mood history for pattern matching (newest first, up to 30)
      const moodHistory = sortedCheckIns
        .slice(0, 30)
        .map((c: { date: string; moodScore: number }) => ({ date: c.date, score: c.moodScore }));

      // Full check-in history for emotional pattern matching (newest first, up to 14)
      const checkInHistory = sortedCheckIns
        .slice(0, 14)
        .map((c: { date: string; anxietyScore: number; lonelinessScore: number; safetyScore: number; tags: string[]; hardestThing: string }) => ({
          date: c.date,
          anxiety: c.anxietyScore,
          loneliness: c.lonelinessScore,
          safety: c.safetyScore,
          tags: c.tags,
          hardestThing: c.hardestThing,
        }));

      // Today's check-in detail
      const todayCheckIn = sortedCheckIns[0];
      const todayISO = new Date().toISOString().split('T')[0];
      const isTodayCheckIn = todayCheckIn?.date === todayISO;

      const ctx: UserContext = {
        nickname: profile?.nickname,
        country: profile?.country,
        needs: profile?.needs,
        safetyLevel,
        recentMoodAvg,
        moodTrend,
        currentMoodScore: params.moodScore ? parseInt(params.moodScore, 10) : undefined,
        journalStreak,
        recentEmotionTags,
        journalPreview: params.journalPreview,
        programProgress: programs.map((p: { title: string; completed: number; total: number }) => ({
          title: p.title,
          completed: p.completed,
          total: p.total,
        })),
        connectionsCount: matches.length,
        chosenFamilyCount: family.length,
        journalSummaries,
        moodHistory,
        checkInHistory,
        ...(isTodayCheckIn && {
          hardestThing: todayCheckIn.hardestThing || undefined,
          anxietyScore: todayCheckIn.anxietyScore,
          lonelinessScore: todayCheckIn.lonelinessScore,
          checkInSafetyScore: todayCheckIn.safetyScore,
          checkInTags: todayCheckIn.tags,
        }),
      };
      setUserContext(ctx);

      setStarters(buildPersonalisedStarters(ctx, t));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-send an insight request when navigating here from the journal.
  useEffect(() => {
    if (!params.journalPreview) return;
    if (userContext === null) return;   // wait for context to be ready
    if (showConsentModal) return;       // wait for consent
    if (autoSentRef.current) return;   // only once
    autoSentRef.current = true;
    handleSend(t('aiCompanion.autoJournalMessage'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userContext, showConsentModal]);

  const aiContext: AIContext = {
    moodScore: params.moodScore ? parseInt(params.moodScore, 10) : undefined,
    journalPreview: params.journalPreview,
    userContext: userContext ?? undefined,
  };

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

  async function handleGrantConsent() {
    await grantAIConsent();
    setShowConsentModal(false);
  }

  function handleDenyConsent() {
    router.back();
  }

  const showStarters = messages.length === 0 && !loading;

  return (
    <SafeAreaView style={styles.safe}>
      {/* AI data-sharing consent modal */}
      <Modal
        visible={showConsentModal}
        transparent
        animationType="fade"
        onRequestClose={handleDenyConsent}
      >
        <View style={styles.consentOverlay}>
          <View style={styles.consentCard}>
            <View style={styles.consentHeader}>
              <Ionicons name="sparkles" size={22} color={Colors.mutedLavender} />
              <Text style={styles.consentTitle}>{t('aiCompanion.consentTitle')}</Text>
            </View>
            <ScrollView style={styles.consentScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.consentBody}>{t('aiCompanion.consentBody')}</Text>
              <Text style={styles.consentSectionLabel}>{t('aiCompanion.consentSharedLabel')}</Text>
              <Text style={styles.consentBody}>{t('aiCompanion.consentSharedBody')}</Text>
              <Text style={styles.consentSectionLabel}>{t('aiCompanion.consentWhoLabel')}</Text>
              <Text style={styles.consentBody}>{t('aiCompanion.consentWhoBody')}</Text>
              <Text style={styles.consentSectionLabel}>{t('aiCompanion.consentChoicesLabel')}</Text>
              <Text style={styles.consentBody}>{t('aiCompanion.consentChoicesBody')}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.consentAgreeBtn} onPress={handleGrantConsent}>
              <Text style={styles.consentAgreeBtnText}>{t('aiCompanion.consentAgree')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.consentDenyBtn} onPress={handleDenyConsent}>
              <Text style={styles.consentDenyBtnText}>{t('aiCompanion.consentGoBack')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <View style={styles.navIcon}>
            <Ionicons name="sparkles" size={18} color={Colors.mutedLavender} />
          </View>
          <Text style={styles.navTitle}>{t('aiCompanion.title')}</Text>
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
          style={styles.flatList}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            showStarters ? (
              <View style={styles.starters}>
                <Text style={styles.startersTitle}>{t('aiCompanion.startersTitle')}</Text>
                {starters.map((s: string) => (
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
                  <Text style={styles.typingText}>{t('aiCompanion.thinking')}</Text>
                </View>
              )}
              {error && (
                <Card style={styles.errorCard}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.alertRed} />
                  <Text style={styles.errorText}>{error}</Text>
                </Card>
              )}
              {remaining !== null && remaining <= 5 && remaining > 0 && (
                <Text style={styles.rateNote}>
                  {remaining === 1
                    ? t('aiCompanion.messagesRemaining', { count: remaining })
                    : t('aiCompanion.messagesRemaining_plural', { count: remaining })}
                </Text>
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
            placeholder={t('aiCompanion.placeholder')}
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
      <View style={[styles.bubbleCol, isUser && styles.bubbleColUser]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.body}</Text>
        </View>
        <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  flex: { flex: 1, backgroundColor: Colors.warmWhite },
  flatList: { flex: 1, backgroundColor: Colors.warmWhite },
  // ── Consent modal ──────────────────────────────────────────────────────────
  consentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  consentCard: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxHeight: '85%',
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  consentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  consentScroll: { maxHeight: 320, marginBottom: Spacing.md },
  consentSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  consentBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  consentBold: { fontWeight: '700', color: Colors.textPrimary },
  consentAgreeBtn: {
    backgroundColor: Colors.safeBlue,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  consentAgreeBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  consentDenyBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  consentDenyBtnText: { color: Colors.textMuted, fontSize: 14 },
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
    backgroundColor: Colors.softGray,
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
  bubbleCol: { maxWidth: '78%', gap: 3, alignItems: 'flex-start' },
  bubbleColUser: { alignItems: 'flex-end' },
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
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  bubbleUser: { backgroundColor: '#2C2724', borderBottomRightRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bubbleAI: { backgroundColor: Colors.softGray, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: Colors.textPrimary },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },
  bubbleTimeUser: { color: Colors.textMuted },
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { supabase } from '@/services/supabase';
import {
  saveJournalEntry,
  getJournalEntries,
  deleteJournalEntry,
  exportJournalAsText,
} from '@/services/storage';
import { usePinModal } from '@/hooks/usePinModal';
import { PinModal } from '@/components/ui/PinModal';
import type { JournalEntry, EmotionTag } from '@/types';
import { EMOTION_TAGS, EMOTION_COLORS } from '@/types';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function JournalEntryScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'sv' ? 'sv-SE' : 'en-US';

  const { id, pinVerified } = useLocalSearchParams<{ id?: string; pinVerified?: string }>();

  const [body, setBody] = useState('');
  const [emotionTags, setEmotionTags] = useState<EmotionTag[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showList, setShowList] = useState(true);
  const [editingId, setEditingId] = useState<string | undefined>(id);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  const { pinModal, pinInput, setPinInput, handleOpenHidden, openPinForLock, handlePinSubmit, closePinModal } = usePinModal(
    (entryId) => {
      setUnlockedIds((prev) => new Set([...prev, entryId]));
      openEntry(entryId);
    },
    () => setIsHidden(true),
  );

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEntries() {
    const all = await getJournalEntries();
    setEntries(all);
    if (id) {
      const existing = all.find((e) => e.id === id);
      if (existing) {
        if (existing.isHidden && pinVerified !== '1') {
          await handleOpenHidden(existing.id);
        } else {
          setBody(existing.body);
          setEmotionTags(existing.emotionTags);
          setIsHidden(existing.isHidden);
          setShowList(false);
        }
      }
    }
  }

  function toggleTag(tag: EmotionTag) {
    setEmotionTags((prev) =>
      prev.includes(tag) ? prev.filter((tt) => tt !== tag) : [...prev, tag]
    );
  }

  function formatDate(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString(locale, {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }

  async function handleSave() {
    if (!body.trim()) {
      Alert.alert(t('journal.emptyEntry'), t('journal.emptyEntryBody'));
      return;
    }
    setLoading(true);
    const existing = editingId ? entries.find((e) => e.id === editingId) : undefined;
    const entry: JournalEntry = {
      id: editingId ?? uuid(),
      date: existing?.date ?? todayISO(),
      body: body.trim(),
      emotionTags,
      isHidden,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    await saveJournalEntry(entry);

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (user) {
        const { error } = await supabase.from('journal_entries').upsert({
          id: entry.id,
          user_id: user.id,
          date: entry.date,
          body: entry.body,
          emotion_tags: entry.emotionTags,
          mood_tag: entry.moodTag ?? null,
          is_hidden: entry.isHidden,
          created_at: entry.createdAt,
        });
        if (error) console.error('Journal sync failed:', error.message);
      }
    }

    const preview = entry.body.slice(0, 200);
    const all = await getJournalEntries();
    setEntries(all);
    setLoading(false);
    if (entry.isHidden) {
      setUnlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
    setShowList(true);
    setBody('');
    setEmotionTags([]);
    setIsHidden(false);
    setEditingId(undefined);

    if (!entry.isHidden) {
      Alert.alert(t('journal.saved'), t('journal.savedBody'), [
        { text: t('common.done') },
        {
          text: t('journal.aiInsight'),
          onPress: () => router.push({ pathname: '/ai-companion', params: { journalPreview: preview } }),
        },
      ]);
    }
  }

  async function handleDelete(entryId: string) {
    Alert.alert(t('journal.deleteTitle'), t('journal.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteJournalEntry(entryId);
          await loadEntries();
        },
      },
    ]);
  }

  async function handleExport() {
    const text = await exportJournalAsText();
    await Share.share({ message: text, title: t('journal.shareTitle') });
  }

  function openEntry(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    setBody(entry.body);
    setEmotionTags(entry.emotionTags);
    setIsHidden(entry.isHidden);
    setEditingId(entryId);
    setShowList(false);
  }

  function startNewEntry() {
    setBody('');
    setEmotionTags([]);
    setIsHidden(false);
    setEditingId(undefined);
    setShowList(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (!showList) { setShowList(true); setBody(''); setEmotionTags([]); }
          else router.back();
        }} accessibilityLabel={t('common.back')}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showList ? t('journal.title') : (editingId ? t('journal.editTitle') : t('journal.newTitle'))}
        </Text>
        {showList ? (
          <TouchableOpacity onPress={handleExport} accessibilityLabel={t('journal.shareTitle')}>
            <Ionicons name="share-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {showList ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Button label={t('journal.newBtn')} onPress={startNewEntry} variant="secondary" style={styles.newBtn} />

          {entries.length === 0 && (
            <Card style={styles.emptyCard}>
              <Ionicons name="book-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{t('journal.empty')}</Text>
            </Card>
          )}

          {entries.map((entry) => {
            const isLocked = entry.isHidden && !unlockedIds.has(entry.id);
            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => {
                  if (entry.isHidden) {
                    if (unlockedIds.has(entry.id)) openEntry(entry.id);
                    else handleOpenHidden(entry.id);
                  } else openEntry(entry.id);
                }}
                activeOpacity={0.75}
                accessibilityLabel={`${t('journal.title')} ${entry.date}`}
              >
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  {entry.isHidden && (
                    <Ionicons name={isLocked ? 'lock-closed' : 'lock-open'} size={14} color={Colors.mutedLavender} />
                  )}
                </View>
                {entry.emotionTags.length > 0 && (
                  <View style={styles.entryTags}>
                    {entry.emotionTags.map((tag) => (
                      <View key={tag} style={[styles.entryTag, { backgroundColor: EMOTION_COLORS[tag] + '20' }]}>
                        <Text style={[styles.entryTagText, { color: EMOTION_COLORS[tag] }]}>
                          {t(`journal.emotionTags.${tag}` as any)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.entryPreview} numberOfLines={isLocked ? 1 : 2}>
                  {isLocked ? t('journal.hiddenPreview') : entry.body}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(entry.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={t('journal.deleteTitle')}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.alertRed} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.tagRow}>
              {EMOTION_TAGS.map((tag) => (
                <Tag
                  key={tag}
                  label={t(`journal.emotionTags.${tag}` as any)}
                  selected={emotionTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                />
              ))}
            </View>

            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder={t('journal.placeholder')}
              placeholderTextColor={Colors.textMuted}
              multiline
              autoFocus
              textAlignVertical="top"
              accessibilityLabel={t('journal.title')}
            />

            <TouchableOpacity
              style={styles.hiddenToggle}
              onPress={async () => {
                if (!isHidden) {
                  const modalShown = await openPinForLock();
                  if (modalShown) return;
                }
                setIsHidden((v) => !v);
              }}
              accessibilityRole="checkbox"
              accessibilityLabel={t('journal.hidePinToggle')}
              accessibilityState={{ checked: isHidden }}
            >
              <Ionicons
                name={isHidden ? 'lock-closed' : 'lock-open-outline'}
                size={18}
                color={isHidden ? Colors.mutedLavender : Colors.textMuted}
              />
              <Text style={[styles.hiddenLabel, isHidden && { color: Colors.mutedLavender }]}>
                {isHidden ? t('journal.hidePinActive') : t('journal.hidePinToggle')}
              </Text>
            </TouchableOpacity>

            <Button label={t('journal.saveBtn')} onPress={handleSave} loading={loading} style={styles.cta} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <PinModal
        visible={pinModal !== null}
        mode={pinModal}
        value={pinInput}
        onChange={setPinInput}
        onSubmit={handlePinSubmit}
        onCancel={closePinModal}
      />

      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  newBtn: { marginBottom: Spacing.sm },
  emptyCard: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  entryCard: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryDate: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  entryTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  entryTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  entryTagText: { fontSize: 11, fontWeight: '600' },
  entryPreview: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  deleteBtn: { alignSelf: 'flex-end', marginTop: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  bodyInput: {
    minHeight: 260,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hiddenToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hiddenLabel: { fontSize: 14, color: Colors.textMuted },
  cta: { marginTop: Spacing.sm },
});

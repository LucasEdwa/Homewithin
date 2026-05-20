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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  verifyPin,
  hasPin,
  setPin,
} from '@/services/storage';
import type { JournalEntry, EmotionTag } from '@/types';
import { EMOTION_TAGS, EMOTION_COLORS } from '@/types';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [body, setBody] = useState('');
  const [emotionTags, setEmotionTags] = useState<EmotionTag[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showList, setShowList] = useState(!id);
  const [editingId, setEditingId] = useState<string | undefined>(id);

  // PIN modal state
  const [pinModal, setPinModal] = useState<'verify' | 'set' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [lockedEntryId, setLockedEntryId] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEntries();
    if (id) {
      setShowList(false);
    }
  }, []);

  async function loadEntries() {
    const all = await getJournalEntries();
    setEntries(all);
    if (id) {
      const existing = all.find((e) => e.id === id);
      if (existing) {
        setBody(existing.body);
        setEmotionTags(existing.emotionTags);
        setIsHidden(existing.isHidden);
        setShowList(false);
      }
    }
  }

  function toggleTag(tag: EmotionTag) {
    setEmotionTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    if (!body.trim()) {
      Alert.alert('Empty entry', 'Write something before saving.');
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

    // Sync to Supabase if authenticated
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
    await loadEntries();
    setLoading(false);
    setShowList(true);
    setBody('');
    setEmotionTags([]);
    setIsHidden(false);
    setEditingId(undefined);

    if (!entry.isHidden) {
      Alert.alert('Saved', 'Your journal entry has been saved.', [
        { text: 'Done' },
        {
          text: 'Get an AI insight',
          onPress: () => router.push({ pathname: '/ai-companion', params: { journalPreview: preview } }),
        },
      ]);
    }
  }

  async function handleDelete(entryId: string) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
    await Share.share({ message: text, title: 'My Journal' });
  }

  async function handleOpenHidden(entryId: string) {
    if (unlockedIds.has(entryId)) {
      openEntry(entryId);
      return;
    }
    const pinSet = await hasPin();
    if (!pinSet) {
      setPinModal('set');
    } else {
      setPinModal('verify');
    }
    setLockedEntryId(entryId);
    setPinInput('');
  }

  async function handlePinSubmit() {
    if (pinModal === 'set') {
      if (pinInput.length < 4) {
        Alert.alert('Too short', 'PIN must be at least 4 digits.');
        return;
      }
      await setPin(pinInput);
      setPinModal(null);
      if (lockedEntryId) {
        setUnlockedIds((prev) => new Set([...prev, lockedEntryId]));
        openEntry(lockedEntryId);
      }
    } else {
      const ok = await verifyPin(pinInput);
      if (ok) {
        setPinModal(null);
        if (lockedEntryId) {
          setUnlockedIds((prev) => new Set([...prev, lockedEntryId]));
          openEntry(lockedEntryId);
        }
      } else {
        Alert.alert('Wrong PIN', 'Please try again.');
        setPinInput('');
      }
    }
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
        }} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{showList ? 'Journal' : (editingId ? 'Edit Entry' : 'New Entry')}</Text>
        {showList ? (
          <TouchableOpacity onPress={handleExport} accessibilityLabel="Export journal">
            <Ionicons name="share-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {showList ? (
        /* ─── Entry list ─── */
        <ScrollView contentContainerStyle={styles.scroll}>
          <Button label="+ New entry" onPress={startNewEntry} variant="secondary" style={styles.newBtn} />

          {entries.length === 0 && (
            <Card style={styles.emptyCard}>
              <Ionicons name="book-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Your journal is empty.{'\n'}Start writing — it's just for you.</Text>
            </Card>
          )}

          {entries.map((entry) => {
            const isLocked = entry.isHidden && !unlockedIds.has(entry.id);
            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => {
                  if (entry.isHidden) handleOpenHidden(entry.id);
                  else openEntry(entry.id);
                }}
                activeOpacity={0.75}
                accessibilityLabel={`Journal entry from ${entry.date}`}
              >
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  {entry.isHidden && (
                    <Ionicons name={isLocked ? 'lock-closed' : 'lock-open'} size={14} color={Colors.mutedLavender} />
                  )}
                </View>
                {entry.emotionTags.length > 0 && (
                  <View style={styles.entryTags}>
                    {entry.emotionTags.map((t) => (
                      <View key={t} style={[styles.entryTag, { backgroundColor: EMOTION_COLORS[t] + '20' }]}>
                        <Text style={[styles.entryTagText, { color: EMOTION_COLORS[t] }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.entryPreview} numberOfLines={isLocked ? 1 : 2}>
                  {isLocked ? '🔒 Hidden — tap to unlock' : entry.body}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(entry.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Delete entry"
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.alertRed} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        /* ─── Write / edit ─── */
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.tagRow}>
              {EMOTION_TAGS.map((tag) => (
                <Tag
                  key={tag}
                  label={tag}
                  selected={emotionTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                />
              ))}
            </View>

            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Write anything. This is private."
              placeholderTextColor={Colors.textMuted}
              multiline
              autoFocus
              textAlignVertical="top"
              accessibilityLabel="Journal entry body"
            />

            <TouchableOpacity
              style={styles.hiddenToggle}
              onPress={() => setIsHidden((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityLabel="Hide this entry behind PIN"
              accessibilityState={{ checked: isHidden }}
            >
              <Ionicons
                name={isHidden ? 'lock-closed' : 'lock-open-outline'}
                size={18}
                color={isHidden ? Colors.mutedLavender : Colors.textMuted}
              />
              <Text style={[styles.hiddenLabel, isHidden && { color: Colors.mutedLavender }]}>
                {isHidden ? 'Hidden — PIN required to open' : 'Hide behind PIN'}
              </Text>
            </TouchableOpacity>

            <Button label="Save entry" onPress={handleSave} loading={loading} style={styles.cta} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* PIN modal */}
      <Modal visible={pinModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.pinCard}>
            <Ionicons name="lock-closed" size={32} color={Colors.mutedLavender} />
            <Text style={styles.pinTitle}>
              {pinModal === 'set' ? 'Set a PIN for hidden entries' : 'Enter PIN to unlock'}
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="Enter PIN"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
              accessibilityLabel="PIN input"
            />
            <View style={styles.pinButtons}>
              <Button label="Cancel" variant="ghost" onPress={() => setPinModal(null)} style={{ flex: 1 }} />
              <Button label="Confirm" onPress={handlePinSubmit} style={{ flex: 1 }} />
            </View>
          </Card>
        </View>
      </Modal>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  pinCard: { width: '100%', alignItems: 'center', gap: Spacing.md },
  pinTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  pinInput: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 24,
    letterSpacing: 8,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  pinButtons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
});

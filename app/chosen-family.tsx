import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmergencyButton } from '@/components/EmergencyButton';
import {
  getSupportPeople,
  addSupportPerson,
  updateSupportPerson,
  removeSupportPerson,
  getNextSuggestedRole,
} from '@/services/chosenFamily';
import { SUPPORT_ROLES } from '@/types';
import type { SupportPerson, SupportRoleMeta } from '@/types';

type EditState = {
  role: SupportRoleMeta;
  existing: SupportPerson | null;
};

export default function ChosenFamilyScreen() {
  const [people, setPeople] = useState<SupportPerson[]>([]);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [nickname, setNickname] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSupportPeople().then(setPeople);
    }, [])
  );

  function openAdd(role: SupportRoleMeta, existing: SupportPerson | null) {
    setEditState({ role, existing });
    setNickname(existing?.nickname ?? '');
    setContactInfo(existing?.contactInfo ?? '');
    setNotes(existing?.notes ?? '');
  }

  function closeModal() {
    setEditState(null);
    setNickname('');
    setContactInfo('');
    setNotes('');
  }

  async function handleSave() {
    if (!editState) return;
    if (!nickname.trim()) {
      Alert.alert('Name required', 'Please enter a nickname for this person.');
      return;
    }
    setSaving(true);
    const wasFirst = people.length === 0;

    if (editState.existing) {
      await updateSupportPerson(editState.existing.id, {
        nickname: nickname.trim(),
        contactInfo: contactInfo.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      await addSupportPerson({
        nickname: nickname.trim(),
        role: editState.role.id,
        contactInfo: contactInfo.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    const updated = await getSupportPeople();
    setPeople(updated);
    setSaving(false);
    closeModal();

    if (wasFirst && updated.length === 1) {
      Alert.alert(
        'Your first trusted person',
        `You've added ${nickname.trim()} to your chosen family. You deserve people who show up for you.`
      );
    }
  }

  async function handleRemove(person: SupportPerson) {
    Alert.alert(
      'Remove from your family?',
      `This will remove ${person.nickname} from your support map.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeSupportPerson(person.id);
            const updated = await getSupportPeople();
            setPeople(updated);
          },
        },
      ]
    );
  }

  async function handleContact(person: SupportPerson, contactType: 'phone' | 'sms' | 'none') {
    if (!person.contactInfo || contactType === 'none') return;
    const scheme = contactType === 'phone' ? 'tel:' : 'sms:';
    const url = scheme + person.contactInfo.replace(/\s/g, '');
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      Linking.openURL(url);
    } else {
      Alert.alert('Cannot open', 'Unable to open this contact method on your device.');
    }
  }

  const filledCount = people.length;
  const nextSuggestion = getNextSuggestedRole(people);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Chosen Family</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hub — You */}
        <View style={styles.hub}>
          <View style={styles.youOrb}>
            <Ionicons name="person" size={28} color={Colors.safeBlue} />
          </View>
          <Text style={styles.youLabel}>You</Text>
          <Text style={styles.hubSub}>
            {filledCount === 0
              ? 'Start building your support network'
              : `${filledCount} of ${SUPPORT_ROLES.length} roles filled`}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(filledCount / SUPPORT_ROLES.length) * 100}%` as any },
            ]}
          />
        </View>

        {/* Next step suggestion */}
        {nextSuggestion && (
          <Card style={[styles.suggestion, { borderLeftColor: nextSuggestion.color }]}>
            <Ionicons name="bulb-outline" size={16} color={nextSuggestion.color} />
            <View style={{ flex: 1 }}>
              <Text style={styles.suggestionTitle}>Next step</Text>
              <Text style={styles.suggestionBody}>
                Add a <Text style={{ fontWeight: '700', color: nextSuggestion.color }}>{nextSuggestion.label}</Text> — {nextSuggestion.description.toLowerCase()}.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openAdd(nextSuggestion, null)}
              style={[styles.suggestionBtn, { backgroundColor: nextSuggestion.color }]}
              accessibilityLabel={`Add ${nextSuggestion.label}`}
              testID="suggestion-add-btn"
            >
              <Text style={styles.suggestionBtnText}>Add</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Role cards */}
        {SUPPORT_ROLES.map((roleMeta) => {
          const person = people.find((p) => p.role === roleMeta.id) ?? null;
          return (
            <RoleCard
              key={roleMeta.id}
              roleMeta={roleMeta}
              person={person}
              onAdd={() => openAdd(roleMeta, null)}
              onEdit={() => person && openAdd(roleMeta, person)}
              onRemove={() => person && handleRemove(person)}
              onContact={() => person && handleContact(person, roleMeta.contactType)}
            />
          );
        })}
      </ScrollView>

      {/* Add / Edit modal */}
      <Modal visible={editState !== null} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: (editState?.role.color ?? Colors.safeBlue) + '22' }]}>
                <Ionicons name={editState?.role.icon as any} size={20} color={editState?.role.color ?? Colors.safeBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {editState?.existing ? `Edit ${editState.role.label}` : `Add ${editState?.role.label}`}
                </Text>
                <Text style={styles.modalSub}>{editState?.role.description}</Text>
              </View>
              <TouchableOpacity onPress={closeModal} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.fields}>
              <Text style={styles.fieldLabel}>Nickname *</Text>
              <TextInput
                style={styles.fieldInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="What do you call them?"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={40}
                accessibilityLabel="Nickname"
                testID="cf-nickname-input"
              />

              {editState?.role.contactType !== 'none' && (
                <>
                  <Text style={styles.fieldLabel}>
                    {editState?.role.contactType === 'phone' ? 'Phone number' : 'Phone / SMS'} (optional)
                  </Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={contactInfo}
                    onChangeText={setContactInfo}
                    placeholder="+1 555 000 0000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={20}
                    accessibilityLabel="Contact info"
                    testID="cf-contact-input"
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything to remember about them…"
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={200}
                textAlignVertical="top"
                accessibilityLabel="Notes"
                testID="cf-notes-input"
              />
            </View>

            <Button
              label={editState?.existing ? 'Save changes' : 'Add to my family'}
              onPress={handleSave}
              loading={saving}
              testID="cf-save-btn"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <EmergencyButton />
    </SafeAreaView>
  );
}

function RoleCard({
  roleMeta,
  person,
  onAdd,
  onEdit,
  onRemove,
  onContact,
}: {
  roleMeta: SupportRoleMeta;
  person: SupportPerson | null;
  onAdd: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onContact: () => void;
}) {
  const filled = person !== null;

  return (
    <TouchableOpacity
      onPress={filled ? onEdit : onAdd}
      activeOpacity={0.8}
      accessibilityLabel={filled ? `Edit ${roleMeta.label}: ${person?.nickname}` : `Add ${roleMeta.label}`}
      testID={`role-card-${roleMeta.id}`}
    >
      <View style={[styles.roleCard, filled ? styles.roleCardFilled : styles.roleCardEmpty, { borderLeftColor: roleMeta.color }]}>
        <View style={[styles.roleIconBg, { backgroundColor: roleMeta.color + '18' }]}>
          <Ionicons name={roleMeta.icon as any} size={20} color={roleMeta.color} />
        </View>

        <View style={styles.roleBody}>
          <Text style={styles.roleLabel}>{roleMeta.label}</Text>
          {filled ? (
            <Text style={styles.roleName}>{person!.nickname}</Text>
          ) : (
            <Text style={styles.roleEmpty}>{roleMeta.description}</Text>
          )}
          {filled && person!.notes ? (
            <Text style={styles.roleNotes} numberOfLines={1}>{person!.notes}</Text>
          ) : null}
        </View>

        <View style={styles.roleActions}>
          {filled && roleMeta.contactType !== 'none' && person!.contactInfo ? (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); onContact(); }}
              style={[styles.contactBtn, { backgroundColor: roleMeta.color + '18' }]}
              accessibilityLabel={`Contact ${person?.nickname}`}
              testID={`contact-btn-${roleMeta.id}`}
            >
              <Ionicons
                name={roleMeta.contactType === 'phone' ? 'call-outline' : 'chatbubble-outline'}
                size={16}
                color={roleMeta.color}
              />
            </TouchableOpacity>
          ) : null}
          {filled ? (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Remove ${person?.nickname}`}
              testID={`remove-btn-${roleMeta.id}`}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.addChip, { borderColor: roleMeta.color }]}>
              <Ionicons name="add" size={14} color={roleMeta.color} />
              <Text style={[styles.addChipText, { color: roleMeta.color }]}>Add</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
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
  navTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  hub: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md },
  youOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.safeBlue + '18',
    borderWidth: 2,
    borderColor: Colors.safeBlue + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  hubSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.safeBlue,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderLeftWidth: 3,
    backgroundColor: Colors.white,
  },
  suggestionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestionBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
  suggestionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  suggestionBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
  },
  roleCardFilled: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  roleCardEmpty: {
    backgroundColor: Colors.softGray,
    borderStyle: 'dashed',
  },
  roleIconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleBody: { flex: 1, gap: 2 },
  roleLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  roleName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  roleEmpty: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  roleNotes: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },
  roleActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 0 },
  contactBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  addChipText: { fontSize: 12, fontWeight: '600' },
  // Modal
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: Colors.warmWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  modalSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  fields: { gap: Spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  fieldInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
});

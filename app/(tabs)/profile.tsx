import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';
import { EmergencyButton } from '@/components/EmergencyButton';

export default function ProfileScreen() {
  const { profile, reset } = useSession();

  function handleDeleteAccount() {
    reset();
    router.replace('/welcome');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile & Privacy</Text>

        {/* Identity */}
        <Card elevated style={styles.section}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.nickname?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.nickname}>{profile?.nickname ?? 'Anonymous'}</Text>
          {profile?.pronouns ? <Text style={styles.pronouns}>{profile.pronouns}</Text> : null}
          <Text style={styles.meta}>{profile?.country ?? ''} · {profile?.ageRange ?? ''}</Text>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <SettingRow
            label="Hide from search"
            value={profile?.hideFromSearch ? 'On' : 'Off'}
            onPress={() => {}}
          />
          <SettingRow label="PIN lock" value="Set up" onPress={() => {}} />
          <SettingRow label="App disguise mode" value="Configure" onPress={() => {}} />
        </Card>

        {/* Data */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Your data</Text>
          <SettingRow label="Export journal & check-ins" value="" onPress={() => {}} />
          <SettingRow label="Notification preferences" value="" onPress={() => {}} />
        </Card>

        {/* Danger zone */}
        <View style={styles.danger}>
          <Button
            label="Delete account & all data"
            variant="danger"
            onPress={handleDeleteAccount}
          />
          <Text style={styles.dangerHint}>
            This will permanently wipe all your data and sign you out.
          </Text>
        </View>

        {/* Privacy explanation */}
        <Card style={[styles.section, styles.privacyNote]}>
          <Text style={styles.privacyTitle}>You control your visibility.</Text>
          <Text style={styles.privacyText}>
            HomeWithin stores as little data as possible. Your journal and safety plan live only on your device unless you choose to back them up. You can leave or delete everything at any time.
          </Text>
        </Card>
      </ScrollView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} accessibilityLabel={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  section: { gap: Spacing.sm },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: Colors.white },
  nickname: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  pronouns: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  meta: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: 15, color: Colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 14, color: Colors.textMuted },
  danger: { gap: Spacing.sm, alignItems: 'center' },
  dangerHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  privacyNote: { backgroundColor: Colors.softGreen + '18', borderLeftWidth: 3, borderLeftColor: Colors.softGreen },
  privacyTitle: { fontSize: 15, fontWeight: '600', color: Colors.softGreen },
  privacyText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});

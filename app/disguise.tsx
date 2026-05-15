import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import type { DisguiseStyle } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';

const STYLES: Array<{ id: DisguiseStyle; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }> = [
  { id: 'weather',    label: 'Weather',    icon: 'partly-sunny-outline',     description: 'A simple weather screen.' },
  { id: 'calculator', label: 'Calculator', icon: 'calculator-outline',       description: 'A working-looking calculator.' },
  { id: 'notes',      label: 'Notes',      icon: 'document-text-outline',    description: 'A plain notes list.' },
];

export default function DisguiseScreen() {
  const { disguiseEnabled, disguiseStyle, setDisguiseEnabled, setDisguiseStyle } = useSession();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>App disguise mode</Text>
        </View>

        <Card style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Disguise on launch</Text>
              <Text style={styles.rowHint}>
                When on, opening the app shows a neutral screen instead of HomeWithin.
              </Text>
            </View>
            <Switch
              value={disguiseEnabled}
              onValueChange={setDisguiseEnabled}
              trackColor={{ false: '#D1D5DB', true: Colors.safeBlue }}
              thumbColor={Platform.OS === 'android' ? Colors.white : undefined}
              ios_backgroundColor="#D1D5DB"
              accessibilityLabel="Disguise on launch"
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Pick a disguise</Text>
        <Card style={styles.section}>
          {STYLES.map((s, i) => {
            const selected = disguiseStyle === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setDisguiseStyle(s.id)}
                style={[styles.styleRow, i < STYLES.length - 1 && styles.styleRowBorder]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Disguise: ${s.label}`}
              >
                <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                  <Ionicons name={s.icon} size={22} color={selected ? Colors.white : Colors.textPrimary} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>{s.label}</Text>
                  <Text style={styles.rowHint}>{s.description}</Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.safeBlue} />
                ) : (
                  <View style={styles.radio} />
                )}
              </Pressable>
            );
          })}
        </Card>

        <Card style={[styles.section, styles.tip]}>
          <Text style={styles.tipTitle}>How to unlock the disguise</Text>
          <Text style={styles.tipBody}>
            Tap the title (top of the disguise screen) <Text style={styles.bold}>5 times within 2 seconds</Text> to reveal HomeWithin.
            {' '}If you've set a PIN, you'll be asked to enter it next.
          </Text>
        </Card>

        <Card style={styles.section}>
          <Pressable
            onPress={() => router.push('/decoy')}
            style={styles.previewBtn}
            accessibilityLabel="Preview disguise"
          >
            <Ionicons name="eye-outline" size={18} color={Colors.safeBlue} />
            <Text style={styles.previewText}>Preview disguise now</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Spacing.sm },
  section: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  rowHint: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  styleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  styleRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: Colors.softGray, alignItems: 'center', justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: Colors.safeBlue },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border },
  tip: { backgroundColor: Colors.softGreen + '18', borderLeftWidth: 3, borderLeftColor: Colors.softGreen },
  tipTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  tipBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  bold: { fontWeight: '700', color: Colors.textPrimary },
  previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: Spacing.sm },
  previewText: { color: Colors.safeBlue, fontSize: 15, fontWeight: '600' },
});

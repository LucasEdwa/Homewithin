import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { EmergencyButton } from '@/components/EmergencyButton';

export default function JournalScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Ionicons name="book-outline" size={56} color={Colors.mutedLavender} />
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>Coming in Sprint 2 — Daily Check-in and Private Journal.</Text>
      </View>
      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

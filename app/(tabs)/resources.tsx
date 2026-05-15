import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { EmergencyButton } from '@/components/EmergencyButton';

export default function ResourcesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Ionicons name="library-outline" size={56} color={Colors.safeBlue} />
        <Text style={styles.title}>Resources</Text>
        <Text style={styles.subtitle}>Coming in Sprint 3 — Resource Library with articles and guides.</Text>
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

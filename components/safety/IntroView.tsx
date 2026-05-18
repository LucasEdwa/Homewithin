import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Step } from './safetyData';

interface IntroViewProps {
  steps: Step[];
  onBegin: () => void;
  onSkip: () => void;
}

export default function IntroView({ steps, onBegin, onSkip }: IntroViewProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-outline" size={36} color={Colors.safeBlue} />
          </View>
          <Text style={styles.title}>Safety check-in</Text>
          <Text style={styles.subtitle}>
            {steps.length} short steps to help us understand how you're doing right now.{'\n\n'}
            Everything stays on your device. You can stop at any point.
          </Text>
        </View>

        <View style={styles.stepList}>
          {steps.map((s) => (
            <View key={s.id} style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: s.iconColor + '18' }]}>
                <Ionicons name={s.icon} size={16} color={s.iconColor} />
              </View>
              <View>
                <Text style={styles.stepNum}>Step {s.id}</Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button label="Begin" onPress={onBegin} />
        <TouchableOpacity onPress={onSkip} style={styles.skipLink}>
          <Text style={styles.skipLinkText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },
  header: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  headerIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.safeBlue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 23 },
  stepList: { gap: Spacing.sm },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 6 },
  stepIcon: {
    width: 36, height: 36, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNum: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  skipLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipLinkText: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'underline' },
});

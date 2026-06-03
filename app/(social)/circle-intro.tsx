import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { getCircle, markCircleIntroSeen } from '@/services/social/circles';
import type { Circle } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CircleIntroScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!circleId) return;
    getCircle(circleId).then((c) => {
      setCircle(c);
      setLoading(false);
    });
  }, [circleId]);

  async function handleEnter() {
    if (!circle) return;
    await markCircleIntroSeen(circle.id);
    router.replace({
      pathname: '/circle',
      params: { circleId: circle.id, name: circle.name },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.safeBlue} style={{ marginTop: Spacing.xl }} />
      </SafeAreaView>
    );
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Circle not found.</Text>
      </SafeAreaView>
    );
  }

  const rules = circle.rules
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navBtn}
          accessibilityLabel="Back"
        >
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Welcome</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="people" size={32} color={Colors.mutedLavender} />
          </View>
          <Text style={styles.title}>{circle.name}</Text>
          <Text style={styles.subtitle}>
            {circle.memberCount} / {circle.memberCap} members
          </Text>
        </View>

        <Text style={styles.description}>{circle.description}</Text>

        <Card style={styles.rulesCard}>
          <View style={styles.rulesHeader}>
            <Ionicons name="heart-outline" size={18} color={Colors.safeBlue} />
            <Text style={styles.rulesTitle}>Circle agreements</Text>
          </View>
          {rules.map((rule, i) => (
            <Text key={i} style={styles.rule}>
              {rule}
            </Text>
          ))}
        </Card>

        <Card style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.softGreen} />
          <Text style={styles.safetyText}>
            You can block a member, leave, or report anyone in this circle at any time. Blocking a member will also remove you from the circle.
          </Text>
        </Card>

        <Button
          label="Enter circle"
          onPress={handleEnter}
          accessibilityLabel="Enter circle"
        />
      </ScrollView>
    </SafeAreaView>
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
  navBtn: { width: 32, padding: Spacing.xs },
  navTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  hero: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.mutedLavender + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: Colors.textMuted },
  description: {
    fontSize: 15, color: Colors.textSecondary, lineHeight: 22,
    textAlign: 'center',
  },
  rulesCard: { backgroundColor: Colors.softGray, gap: Spacing.xs, borderRadius: Radius.lg },
  rulesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  rulesTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  rule: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  safetyNote: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.softGreen + '18',
  },
  safetyText: { flex: 1, fontSize: 13, color: Colors.softGreen, fontWeight: '500' },
  error: { textAlign: 'center', marginTop: Spacing.xl, color: Colors.textMuted },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const PILLARS: { icon: IoniconsName; label: string; color: string }[] = [
  { icon: 'shield-checkmark-outline', label: 'Safety',     color: Colors.safeBlue },
  { icon: 'leaf-outline',             label: 'Healing',    color: Colors.softGreen },
  { icon: 'people-outline',           label: 'Connection', color: Colors.mutedLavender },
  { icon: 'star-outline',             label: 'Growth',     color: Colors.safetyYellow },
];

export default function WelcomeScreen() {
  function handleQuickExit() {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      router.replace('/decoy');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity
        style={styles.quickExit}
        onPress={handleQuickExit}
        accessibilityLabel="Quick exit — close app"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={13} color={Colors.white} />
        <Text style={styles.quickExitText}>Exit</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="home" size={36} color={Colors.safeBlue} />
          </View>
          <Text style={styles.appName}>HomeWithin</Text>
          <Text style={styles.tagline}>You are safe here.</Text>
        </View>

        {/* Pillars */}
        <View style={styles.pillars}>
          {PILLARS.map((p) => (
            <View key={p.label} style={styles.pillar}>
              <View style={[styles.pillarIconBg, { backgroundColor: p.color + '18' }]}>
                <Ionicons name={p.icon} size={22} color={p.color} />
              </View>
              <Text style={styles.pillarLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Button
            label="Start anonymously"
            onPress={() => router.push('/onboarding/step1')}
            variant="primary"
            style={styles.ctaBtn}
          />
          <Button
            label="Sign in"
            onPress={() => router.push('/signin')}
            variant="secondary"
            style={styles.ctaBtn}
          />
          <TouchableOpacity
            onPress={() => router.push('/onboarding/step1')}
            accessibilityLabel="Continue as guest"
          >
            <Text style={styles.guestLink}>Continue as guest — no account needed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  quickExit: {
    position: 'absolute',
    top: 56,
    right: Spacing.md,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.alertRed,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  quickExitText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  logoArea: { alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.sm },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.safeBlue + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 32, fontWeight: '700', color: Colors.safeBlue, letterSpacing: -0.5 },
  tagline: { fontSize: 18, color: Colors.textSecondary, fontStyle: 'italic' },
  pillars: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: Spacing.xl },
  pillar: { alignItems: 'center', gap: Spacing.xs },
  pillarIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarLabel: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary },
  ctas: { gap: Spacing.md, alignItems: 'center' },
  ctaBtn: { width: '100%' },
  guestLink: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'underline', marginTop: Spacing.xs },
});

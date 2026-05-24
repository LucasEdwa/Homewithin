import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import type { UserProfile } from '@/context/SessionContext';
import { useSession } from '@/context/SessionContext';
import { syncProfile } from '@/services/social/matching';
import { signOut, supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const PILLARS: { icon: IoniconsName; label: string; color: string }[] = [
  { icon: 'shield-checkmark-outline', label: 'Safety',     color: Colors.safeBlue },
  { icon: 'leaf-outline',             label: 'Healing',    color: Colors.softGreen },
  { icon: 'people-outline',           label: 'Connection', color: Colors.mutedLavender },
  { icon: 'star-outline',             label: 'Growth',     color: Colors.safetyYellow },
];

const RING_COUNT = 3;
const RING_DELAY = 700;
const RING_DURATION = 2200;

const GUEST_NAMES = ['Sage', 'River', 'Quinn', 'Wren', 'Sky', 'Ash', 'Reed', 'Nova', 'Fern', 'Bay'];

export default function WelcomeScreen() {
  const { setProfile, completeOnboarding } = useSession();
  const [guestLoading, setGuestLoading] = useState(false);
  const rings = useRef(
    Array.from({ length: RING_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = rings.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * RING_DELAY),
          Animated.timing(anim, {
            toValue: 1,
            duration: RING_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStartAnonymously() {
    await signOut().catch(() => {});
    router.push('/onboarding/step1');
  }

  async function handleContinueAsGuest() {
    if (guestLoading) return;
    setGuestLoading(true);
    try {
      await signOut().catch(() => {});
      if (supabase) {
        const { error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) {
          // Anonymous auth unavailable — fall back to full onboarding
          router.push('/onboarding/step1');
          return;
        }
      }
      const nickname = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
      const profile: UserProfile = {
        nickname,
        pronouns: '',
        ageRange: '',
        language: 'English',
        country: '',
        hideFromSearch: false,
        needs: [],
        intentions: [],
        isAnonymous: true,
      };
      await setProfile(profile);
      await completeOnboarding();
      await syncProfile(profile).catch(() => {});
      router.replace('/(tabs)');
    } finally {
      setGuestLoading(false);
    }
  }

 

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {/* Logo with radiating rings */}
        <View style={styles.logoArea}>
          <View style={styles.ringContainer}>
            {rings.map((anim, i) => {
              const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
              const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.35, 0] });
              return (
                <Animated.View
                  key={i}
                  style={[styles.ring, { transform: [{ scale }], opacity }]}
                />
              );
            })}
            <Image
              source={require('../../assets/images/homeIcon.png')}
              style={styles.appIcon}
              contentFit="contain"
            />
          </View>
          <Text style={styles.tagline}>You are safe here.</Text>
        </View>

        {/* Pillars */}
        <View style={styles.pillars}>
          {PILLARS.map((p) => (
            <View key={p.label} style={styles.pillar}>
              <View style={[styles.pillarIconBg, { backgroundColor: p.color + '20' }]}>
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
            onPress={handleStartAnonymously}
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
            onPress={handleContinueAsGuest}
            accessibilityLabel="Continue as guest"
            disabled={guestLoading}
          >
            {guestLoading
              ? <ActivityIndicator size="small" color={Colors.textMuted} />
              : <Text style={styles.guestLink}>Continue as guest — no account needed</Text>
            }
          </TouchableOpacity>
          <Text style={styles.legalLine}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms of Use</Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const ICON_SIZE = 400;
const RING_SIZE = ICON_SIZE -20; 

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  logoArea: { alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.xl },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE ,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.safeBlue,
  },
  appIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
      borderRadius: 40,
      objectFit: 'cover',
  },
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
  guestLink: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
    marginTop: Spacing.xs,
  },
  legalLine: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  legalLink: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

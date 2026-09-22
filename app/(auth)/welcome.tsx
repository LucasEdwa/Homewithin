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
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const PILLAR_META: { icon: IoniconsName; key: string; color: string }[] = [
  { icon: 'shield-checkmark-outline', key: 'safety',     color: Colors.safeBlue },
  { icon: 'leaf-outline',             key: 'healing',    color: Colors.softGreen },
  { icon: 'people-outline',           key: 'connection', color: Colors.mutedLavender },
  { icon: 'star-outline',             key: 'growth',     color: Colors.safetyYellow },
];

const RING_COUNT = 3;
const RING_DELAY = 700;
const RING_DURATION = 2200;

const GUEST_NAMES = ['Sage', 'River', 'Quinn', 'Wren', 'Sky', 'Ash', 'Reed', 'Nova', 'Fern', 'Bay'];

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { setProfile, completeOnboarding } = useSession();
  const [guestLoading, setGuestLoading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  // Icon takes ~28% of screen height — readable on all iPhones, fits with buttons visible.
  const ICON_SIZE = Math.min(Math.round(screenHeight * 0.28), 240);
  const RING_SIZE = ICON_SIZE + 20;
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo with radiating rings */}
        <View style={styles.logoArea}>
          <View style={[styles.ringContainer, { width: RING_SIZE, height: RING_SIZE }]}>
            {rings.map((anim, i) => {
              const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
              const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.35, 0] });
              return (
                <Animated.View
                  key={i}
                  style={[styles.ring, { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2 }, { transform: [{ scale }], opacity }]}
                />
              );
            })}
            <Image
              source={require('../../assets/images/image.png')}
              style={[styles.appIcon, { width: ICON_SIZE, height: ICON_SIZE }]}
              contentFit="contain"
            />
          </View>
          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
        </View>

        {/* Pillars */}
        <View style={styles.pillars}>
          {PILLAR_META.map((p) => (
            <View key={p.key} style={styles.pillar}>
              <View style={[styles.pillarIconBg, { backgroundColor: p.color + '20' }]}>
                <Ionicons name={p.icon} size={22} color={p.color} />
              </View>
              <Text style={styles.pillarLabel}>{t(`welcome.pillars.${p.key}` as any)}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Button
            label={t('welcome.startAnonymously')}
            onPress={handleStartAnonymously}
            variant="primary"
            style={styles.ctaBtn}
            disabled={!termsAgreed}
          />
          <Button
            label={t('welcome.signIn')}
            onPress={() => router.push('/signin')}
            variant="secondary"
            style={styles.ctaBtn}
            disabled={!termsAgreed}
          />
          <TouchableOpacity
            onPress={handleContinueAsGuest}
            accessibilityLabel={t('welcome.continueAsGuest')}
            disabled={guestLoading || !termsAgreed}
          >
            {guestLoading
              ? <ActivityIndicator size="small" color={Colors.textMuted} />
              : <Text style={[styles.guestLink, !termsAgreed && styles.guestLinkDisabled]}>{t('welcome.continueAsGuest')}</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTermsAgreed((v) => !v)}
            style={styles.checkboxRow}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAgreed }}
            accessibilityLabel={t('welcome.agreePrefix') + t('welcome.termsOfUse') + t('welcome.and') + t('welcome.privacyPolicy')}
          >
            <View style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}>
              {termsAgreed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              {t('welcome.agreePrefix')}
              <Text style={styles.legalLink} onPress={() => router.push('/terms')}>{t('welcome.termsOfUse')}</Text>
              {t('welcome.and')}
              <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>{t('welcome.privacyPolicy')}</Text>
              {t('welcome.agreeSuffix')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ICON_SIZE and RING_SIZE are computed inside the component via useWindowDimensions.

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0b0b' },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  logoArea: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.md },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.safeBlue,
  },
  appIcon: {
    borderRadius: 0,
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
  guestLinkDisabled: {
    opacity: 0.4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.safeBlue,
    borderColor: Colors.safeBlue,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

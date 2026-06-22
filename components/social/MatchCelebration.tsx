import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import type { PeerProfile } from '@/types';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PeerAvatar } from './PeerAvatar';

// ─── Particle config ──────────────────────────────────────────────────────────

const BURST_COLORS = [
  Colors.softGreen,
  Colors.mutedLavender,
  Colors.warmAmber,
  'rgba(255,255,255,0.85)',
  Colors.softGreen,
  Colors.mutedLavender,
];

interface ParticleConfig {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

function buildParticles(count = 20): ParticleConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    angle: (360 / count) * i + (i % 2 === 0 ? 9 : -9),
    distance: 72 + (i % 5) * 20,
    size: 5 + (i % 3) * 3,
    color: BURST_COLORS[i % BURST_COLORS.length],
    delay: Math.floor(i / 4) * 45,
  }));
}

// ─── Single particle ──────────────────────────────────────────────────────────

function Particle({ angle, distance, size, color, delay }: ParticleConfig) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const rad = (angle * Math.PI) / 180;
    tx.value = withDelay(delay, withSpring(Math.cos(rad) * distance, { damping: 16, stiffness: 65 }));
    ty.value = withDelay(delay, withSpring(Math.sin(rad) * distance, { damping: 16, stiffness: 65 }));
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 55 }),
        withDelay(180, withTiming(0, { duration: 520, easing: Easing.out(Easing.quad) })),
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.particle, style, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
    />
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface MatchCelebrationProps {
  peer: PeerProfile;
  matchId: string;
  onClose: () => void;
}

export function MatchCelebration({ peer, matchId, onClose }: MatchCelebrationProps) {
  const { t } = useTranslation();
  const particles = useMemo(() => buildParticles(), []);

  // Animated values
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.55);
  const cardOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.75);
  const ringOpacity = useSharedValue(0);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  // Entrance
  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 220 });
    cardScale.value = withSpring(1, { damping: 11, stiffness: 150, mass: 0.85 });
    cardOpacity.value = withTiming(1, { duration: 180 });
    ringOpacity.value = withDelay(
      160,
      withSequence(
        withTiming(0.55, { duration: 80 }),
        withTiming(0, { duration: 620, easing: Easing.out(Easing.cubic) }),
      ),
    );
    ringScale.value = withDelay(160, withTiming(2.1, { duration: 700, easing: Easing.out(Easing.quad) }));
  }, []);

  // Exit animation then call onClose
  const animateOut = useCallback(
    (afterClose?: () => void) => {
      'worklet';
      backdropOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.88, { duration: 180 });
      cardOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) {
          runOnJS(onClose)();
          if (afterClose) runOnJS(afterClose)();
        }
      });
    },
    [onClose],
  );

  function handleOpenChat() {
    animateOut(() => {
      router.push({
        pathname: '/chat',
        params: { matchId, nickname: peer.nickname, avatarUrl: peer.avatarUrl ?? '' },
      });
    });
  }

  function handleDismiss() {
    animateOut();
  }

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        {/* Tap backdrop to dismiss */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleDismiss} />

        <Animated.View style={[styles.card, cardStyle]}>
          {/* Particle + ripple origin, centered on avatar */}
          <View style={styles.avatarArea}>
            <View style={styles.particleAnchor} pointerEvents="none">
              <Animated.View style={[styles.ring, ringStyle]} />
              {particles.map((p, i) => (
                <Particle key={i} {...p} />
              ))}
            </View>
            <PeerAvatar nickname={peer.nickname} avatarUrl={peer.avatarUrl} size={80} />
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.headline}>{t('social.itIsAMatch')}</Text>
            <Text style={styles.subtext}>
              {t('social.youConnected', { name: peer.nickname })}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleOpenChat} activeOpacity={0.85}>
              <Text style={styles.chatBtnText}>{t('social.openChat')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterBtn} onPress={handleDismiss} activeOpacity={0.7}>
              <Text style={styles.laterBtnText}>{t('social.later')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.xl,
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  // Avatar + particles share the same space
  avatarArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Zero-size anchor so particles and ring radiate from avatar center
  particleAnchor: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.softGreen,
    marginLeft: -40,
    marginTop: -40,
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  peerName: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  chatBtn: {
    backgroundColor: Colors.softGreen,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chatBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
  laterBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

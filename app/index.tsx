import { Colors } from '@/constants/Colors';
import { useSession } from '@/context/SessionContext';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const RING_COUNT = 3;
const RING_DELAY = 700;
const RING_DURATION = 2200;
const MIN_SPLASH_MS = 3000;

const ICON_SIZE = 200;
const RING_SIZE = ICON_SIZE + 20;

export default function SplashScreen() {
  const { onboardingComplete, loading, locked, disguiseEnabled } = useSession();
  const [timerDone, setTimerDone] = useState(false);

  const rings = useRef(
    Array.from({ length: RING_COUNT }, () => new Animated.Value(0))
  ).current;

  // Start radiating ring animations.
  useEffect(() => {
    const animations = rings.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * RING_DELAY),
          Animated.timing(anim, { toValue: 1, duration: RING_DURATION, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, []);

  // 3-second minimum display.
  useEffect(() => {
    const t = setTimeout(() => setTimerDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // Navigate only when both session and timer are ready.
  useEffect(() => {
    if (loading || !timerDone) return;
    if (disguiseEnabled) {
      router.replace('/decoy');
    } else if (locked) {
      router.replace('/lock');
    } else if (onboardingComplete) {
      router.replace('/(tabs)');
    } else {
      router.replace('/welcome');
    }
  }, [loading, timerDone, onboardingComplete, locked, disguiseEnabled]);

  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        {rings.map((anim, i) => {
          const ringColors = [Colors.mutedLavender, Colors.softGreen, Colors.safetyYellow];
          const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
          const opacity = anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.55, 0] });
          return (
            <Animated.View
              key={i}
              style={[styles.ring, { transform: [{ scale }], opacity, borderColor: ringColors[i] }]}
            />
          );
        })}
        <Image
          source={require('../assets/images/homeIcon.png')}
          style={styles.icon}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    overflow: 'hidden',
  },
});

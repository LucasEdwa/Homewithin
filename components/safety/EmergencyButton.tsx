import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

const BTN = 64;

export function EmergencyButton() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    function pulse(anim: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    }
    const a1 = pulse(ring1, 0);
    const a2 = pulse(ring2, 1000);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ringStyle(anim: Animated.Value) {
    return {
      transform: [{
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }),
      }],
      opacity: anim.interpolate({
        inputRange: [0, 0.2, 1],
        outputRange: [0.5, 0.25, 0],
      }),
    };
  }

  function handlePressIn() {
    Animated.spring(btnScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/emergency');
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.ring, ringStyle(ring1)]} />
      <Animated.View style={[styles.ring, ringStyle(ring2)]} />

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel="Emergency support"
        accessibilityRole="button"
        accessibilityHint="Opens emergency help and crisis resources"
      >
        <Animated.View style={[styles.btn, { transform: [{ scale: btnScale }] }]}>
          {/* inner glow ring */}
          <View style={styles.innerRing} />

          <Ionicons name="shield-checkmark" size={22} color={Colors.white} />
          <Text style={styles.label}>SOS</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 104,
    right: 20,
    width: BTN,
    height: BTN,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ring: {
    position: 'absolute',
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: Colors.alertRed,
  },
  btn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: Colors.alertRed,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    // layered shadow for depth
    shadowColor: Colors.alertRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 14,
  },
  innerRing: {
    position: 'absolute',
    inset: 4,
    borderRadius: (BTN - 8) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
    marginTop: -1,
  },
});

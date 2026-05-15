import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useSession } from '@/context/SessionContext';

export default function SplashScreen() {
  const { onboardingComplete, loading, locked, disguiseEnabled } = useSession();

  useEffect(() => {
    if (loading) return;
    if (disguiseEnabled) {
      router.replace('/decoy');
    } else if (locked) {
      router.replace('/lock');
    } else if (onboardingComplete) {
      router.replace('/(tabs)');
    } else {
      router.replace('/welcome');
    }
  }, [loading, onboardingComplete, locked, disguiseEnabled]);

  return (
    <View style={styles.container}>
      <Ionicons name="home" size={56} color={Colors.safeBlue} />
      <Text style={styles.name}>HomeWithin</Text>
      <Text style={styles.tagline}>You are safe here.</Text>
      <ActivityIndicator color={Colors.safeBlue} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  name: { fontSize: 32, fontWeight: '700', color: Colors.safeBlue, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: Colors.textSecondary, fontStyle: 'italic' },
  loader: { marginTop: 24 },
});

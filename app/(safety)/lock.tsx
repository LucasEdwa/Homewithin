import { PinPad } from '@/components/ui/PinPad';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { verifyPin } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function LockScreen() {
  const { onboardingComplete, unlock } = useSession();
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function handleChange(next: string) {
    setValue(next);
    if (next.length < 4) return;

    const ok = await verifyPin(next);
    if (!ok) {
      setShake(true);
      setAttempts((a) => a + 1);
      setTimeout(() => {
        setValue('');
        setShake(false);
      }, 300);
      return;
    }
    unlock();
    router.replace(onboardingComplete ? '/(tabs)' : '/welcome');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.logo}>
          <Ionicons name="lock-closed" size={36} color={Colors.safeBlue} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Enter your PIN to unlock HomeWithin.</Text>

        <PinPad value={value} onChange={handleChange} shake={shake} testIDPrefix="lock-pin" />

        {attempts > 0 ? (
          <Text style={styles.error}>
            Wrong PIN. {attempts >= 3 ? 'If you forgot it, you can reinstall the app — your local data will be wiped.' : 'Try again.'}
          </Text>
        ) : (
          <View style={styles.errorSpace} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.lg },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.safeBlue + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  error: {
    color: Colors.alertRed,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  errorSpace: { minHeight: 20, marginTop: Spacing.md },
});

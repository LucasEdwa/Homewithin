import { PinPad } from '@/components/ui/PinPad';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { deletePin, setPin, verifyPin } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Mode = 'setup' | 'change' | 'remove';

export default function PinSettingsScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const { setPinEnabled } = useSession();
  const [mode] = useState<Mode>((modeParam as Mode) ?? 'setup');

  // Steps:
  // setup:  enter → confirm
  // change: verify → enter → confirm
  // remove: verify
  type Step = 'verify' | 'enter' | 'confirm';
  const [step, setStep] = useState<Step>(
    mode === 'setup' ? 'enter' : 'verify'
  );
  const [value, setValue] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  function shakeAndReset(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => {
      setValue('');
      setShake(false);
    }, 300);
  }

  async function handleChange(next: string) {
    setError(null);
    setValue(next);
    if (next.length < 4) return;

    if (step === 'verify') {
      const ok = await verifyPin(next);
      if (!ok) {
        shakeAndReset('Wrong PIN. Try again.');
        return;
      }
      if (mode === 'remove') {
        await deletePin();
        setPinEnabled(false);
        Alert.alert('PIN removed', 'Your app is no longer locked with a PIN.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      // change → move to enter new
      setValue('');
      setStep('enter');
      return;
    }

    if (step === 'enter') {
      setFirstPin(next);
      setValue('');
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      if (next !== firstPin) {
        setFirstPin('');
        setStep('enter');
        shakeAndReset('PINs don\'t match. Start over.');
        return;
      }
      await setPin(next);
      setPinEnabled(true);
      Alert.alert(
        mode === 'change' ? 'PIN updated' : 'PIN set',
        'Your app will be locked next time it opens or returns from background.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }

  const titles: Record<Step, string> = {
    verify:  mode === 'remove' ? 'Enter PIN to remove' : 'Enter current PIN',
    enter:   mode === 'change' ? 'Enter new PIN' : 'Create a PIN',
    confirm: 'Confirm PIN',
  };
  const subtitles: Record<Step, string> = {
    verify:  'Required to make changes.',
    enter:   '4 digits. You can change or remove it later.',
    confirm: 'Re-enter the same PIN.',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {mode === 'remove' ? 'Remove PIN' : mode === 'change' ? 'Change PIN' : 'Set up PIN'}
        </Text>
        <View style={styles.navBtn} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{titles[step]}</Text>
        <Text style={styles.subtitle}>{subtitles[step]}</Text>

        <PinPad value={value} onChange={handleChange} shake={shake} />

        {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpace} />}
      </View>
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
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  error: { color: Colors.alertRed, fontSize: 14, marginTop: Spacing.md, minHeight: 20 },
  errorSpace: { minHeight: 20, marginTop: Spacing.md },
});

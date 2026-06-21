import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase, isSupabaseConfigured } from '@/services/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!supabase) return;
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) setError(authError.message);
    else router.replace('/(tabs)');
  }

  async function handleSignUp() {
    if (!supabase) return;
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    // Supabase returns a session immediately if email confirmation is disabled.
    // If session is null, the user needs to confirm their email first.
    if (!data.session) {
      Alert.alert(
        'Check your email',
        'We sent a confirmation link to ' + email.trim() + '. Open it and then sign in.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push('/onboarding/step1');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your journal, connections, and progress.
        </Text>

        {!isSupabaseConfigured && (
          <View style={styles.configBanner}>
            <Text style={styles.configTitle}>Supabase not configured</Text>
            <Text style={styles.configBody}>
              Add your project credentials to <Text style={styles.configCode}>.env</Text> to enable sign-in:
            </Text>
            <Text style={styles.configCode}>
              EXPO_PUBLIC_SUPABASE_URL=https://…{'\n'}
              EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ…
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={isSupabaseConfigured}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={isSupabaseConfigured}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <Button
          label="Sign in"
          onPress={handleSignIn}
          loading={loading}
          disabled={!isSupabaseConfigured}
          style={styles.cta}
        />
        <Button
          label="Create account"
          onPress={handleSignUp}
          variant="secondary"
          disabled={!isSupabaseConfigured}
          style={styles.cta}
        />

        <TouchableOpacity onPress={() => router.push('/onboarding/step1')} style={styles.guestRow}>
          <Text style={styles.guestLink}>Continue anonymously — no account needed</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  back: { marginBottom: Spacing.xl },
  backText: { fontSize: 15, color: Colors.textMuted },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  configBanner: {
    backgroundColor: Colors.warmAmber + '15',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.safetyYellow,
    gap: Spacing.xs,
  },
  configTitle: { fontSize: 14, fontWeight: '700', color: Colors.warmAmber },
  configBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  configCode: { fontSize: 11, fontFamily: 'monospace', color: Colors.textMuted, lineHeight: 18 },
  form: { gap: Spacing.md, marginBottom: Spacing.xl },
  error: { fontSize: 13, color: Colors.alertRed },
  cta: { marginBottom: Spacing.md },
  guestRow: { alignItems: 'center', marginTop: Spacing.sm },
  guestLink: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'underline' },
});

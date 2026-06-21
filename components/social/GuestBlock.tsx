import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function GuestBlock() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.mutedLavender} />
      </View>
      <Text style={styles.title}>Sign in to connect</Text>
      <Text style={styles.body}>
        Connecting with others is only available to signed-in members. This keeps every match
        meaningful — real people, real intention.
      </Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.replace('/welcome')}
        activeOpacity={0.85}
        accessibilityLabel="Sign in or create account"
      >
        <Text style={styles.primaryText}>Sign in or create account</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.back()}
        activeOpacity={0.75}
        accessibilityLabel="Go back"
      >
        <Text style={styles.secondaryText}>Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingVertical: Spacing.xxl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    backgroundColor: Colors.mutedLavender + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: Colors.mutedLavender,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  primaryText: {
    color: Colors.black,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});

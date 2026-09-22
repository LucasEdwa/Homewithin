import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function GuestBlock() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.mutedLavender} />
      </View>
      <Text style={styles.title}>{t('social.signInToConnect')}</Text>
      <Text style={styles.body}>{t('social.signInBody')}</Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.replace('/welcome')}
        activeOpacity={0.85}
        accessibilityLabel={t('social.signInBtn')}
      >
        <Text style={styles.primaryText}>{t('social.signInBtn')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.back()}
        activeOpacity={0.75}
        accessibilityLabel={t('common.goBack')}
      >
        <Text style={styles.secondaryText}>{t('common.goBack')}</Text>
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

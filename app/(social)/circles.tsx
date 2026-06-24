import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { joinCircle, listCircles } from '@/services/social/circles';
import type { Circle } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const CIRCLE_ACCENTS = [
  Colors.mutedLavender,
  Colors.softGreen,
  Colors.warmAmber,
  '#7BB8E3',
];

function accentFor(name: string): string {
  const sum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return CIRCLE_ACCENTS[sum % CIRCLE_ACCENTS.length];
}

function CapacityDots({ count, cap, color, label }: { count: number; cap: number; color: string; label: string }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: cap }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i < count ? color : 'rgba(255,255,255,0.1)' }]}
        />
      ))}
      <Text style={styles.dotsLabel}>{label}</Text>
    </View>
  );
}

export default function CirclesScreen() {
  const { t, i18n } = useTranslation();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listCircles(i18n.language);
    setCircles(data);
    setLoading(false);
  }, [i18n.language]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleJoin(circle: Circle) {
    setJoiningId(circle.id);
    const res = await joinCircle(circle.id);
    setJoiningId(null);

    if (!res.ok) {
      if (res.reason === 'full') {
        Alert.alert(t('circles.isFullTitle'), t('circles.isFullBody'));
      } else if (res.reason === 'auth') {
        Alert.alert(t('circles.signInNeeded'), t('circles.signInNeededBody'));
      } else {
        Alert.alert(t('circles.couldNotJoin'), t('circles.couldNotJoinBody'));
      }
      return;
    }

    await load();
    router.push({ pathname: '/circle-intro', params: { circleId: circle.id } });
  }

  function handleOpen(circle: Circle) {
    if (!circle.introSeen) {
      router.push({ pathname: '/circle-intro', params: { circleId: circle.id } });
    } else {
      router.push({ pathname: '/circle', params: { circleId: circle.id, name: circle.name } });
    }
  }

  const joined = circles.filter((c) => c.isMember);
  const available = circles.filter((c) => !c.isMember && c.memberCount < c.memberCap);
  const full = circles.filter((c) => !c.isMember && c.memberCount >= c.memberCap);

  function renderCard(c: Circle) {
    const accent = accentFor(c.name);
    const isFull = c.memberCount >= c.memberCap;
    const isJoining = joiningId === c.id;

    return (
      <View key={c.id} style={styles.card}>
        {/* left accent bar */}
        <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />

        <View style={styles.cardBody}>
          {/* header row */}
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: accent + '22' }]}>
              <Ionicons name="people" size={20} color={accent} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              {c.category ? (
                <Text style={styles.cardCategory}>{c.category}</Text>
              ) : null}
            </View>
            {c.isMember && (
              <View style={[styles.statusBadge, { backgroundColor: Colors.softGreen + '20' }]}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.softGreen} />
                <Text style={[styles.statusBadgeText, { color: Colors.softGreen }]}>{t('circles.joined')}</Text>
              </View>
            )}
            {isFull && !c.isMember && (
              <View style={[styles.statusBadge, { backgroundColor: Colors.textMuted + '30' }]}>
                <Ionicons name="lock-closed" size={11} color={Colors.textMuted} />
                <Text style={[styles.statusBadgeText, { color: Colors.textMuted }]}>{t('circles.full')}</Text>
              </View>
            )}
          </View>

          {/* description */}
          <Text style={styles.cardDesc}>{c.description}</Text>

          {/* capacity dots */}
          <CapacityDots count={c.memberCount} cap={c.memberCap} color={accent} label={t('circles.membersCount', { count: c.memberCount, cap: c.memberCap })} />

          {/* action button */}
          {c.isMember ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: accent + '20', borderColor: accent + '50' }]}
              onPress={() => handleOpen(c)}
              accessibilityLabel={`Open ${c.name}`}
              testID={`open-circle-${c.slug}`}
            >
              <Ionicons name="chatbubbles-outline" size={16} color={accent} />
              <Text style={[styles.actionBtnText, { color: accent }]}>{t('circles.openCircle')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isFull
                  ? { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: Colors.border }
                  : { backgroundColor: accent + '20', borderColor: accent + '50' },
              ]}
              onPress={() => !isFull && handleJoin(c)}
              disabled={isFull || isJoining}
              accessibilityLabel={isFull ? `${c.name} is full` : `Join ${c.name}`}
              testID={`join-circle-${c.slug}`}
            >
              {isJoining ? (
                <ActivityIndicator color={accent} size="small" />
              ) : (
                <>
                  <Ionicons
                    name={isFull ? 'lock-closed-outline' : 'add-circle-outline'}
                    size={16}
                    color={isFull ? Colors.textMuted : accent}
                  />
                  <Text style={[styles.actionBtnText, { color: isFull ? Colors.textMuted : accent }]}>
                    {isFull ? t('circles.circleFull') : t('circles.joinCircle')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t('circles.title')}</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>{t('circles.intro')}</Text>

        {loading && (
          <ActivityIndicator color={Colors.mutedLavender} style={{ marginTop: Spacing.xl }} />
        )}

        {!loading && circles.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={42} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{t('circles.noCircles')}</Text>
          </View>
        )}

        {!loading && joined.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('circles.sectionYours').toUpperCase()}</Text>
            {joined.map(renderCard)}
          </>
        )}

        {!loading && available.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('circles.sectionAvailable').toUpperCase()}</Text>
            {available.map(renderCard)}
          </>
        )}

        {!loading && full.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('circles.sectionFull').toUpperCase()}</Text>
            {full.map(renderCard)}
          </>
        )}

        {!loading && circles.length > 0 && (
          <View style={styles.safetyNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.softGreen} />
            <Text style={styles.safetyText}>{t('circles.safetyNote')}</Text>
          </View>
        )}
      </ScrollView>
      <EmergencyButton />
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
  navBtn: { width: 36, padding: Spacing.xs },
  navTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.md, paddingBottom: 120, gap: Spacing.sm },
  intro: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginBottom: Spacing.xs },
  empty: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl * 2 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
  },
  // ── Card ────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  cardAccentBar: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardCategory: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  // ── Capacity dots ────────────────────────────────────────────
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotsLabel: { fontSize: 11, color: Colors.textMuted, marginLeft: 4 },
  // ── Action button ────────────────────────────────────────────
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  // ── Safety note ──────────────────────────────────────────────
  safetyNote: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.softGreen + '15',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.softGreen + '30',
  },
  safetyText: { flex: 1, fontSize: 13, color: Colors.softGreen, fontWeight: '500', lineHeight: 18 },
});



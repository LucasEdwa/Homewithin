import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { Card } from '@/components/ui/Card';
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

export default function CirclesScreen() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listCircles();
    setCircles(data);
    setLoading(false);
  }, []);

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
        Alert.alert('Circle is full', 'This circle has reached its member limit. Try another one — small spaces stay safer.');
      } else if (res.reason === 'auth') {
        Alert.alert('Sign in needed', 'Please sign in to join a circle.');
      } else {
        Alert.alert('Could not join', 'Please check your connection and try again.');
      }
      return;
    }

    await load();
    router.push({
      pathname: '/circle-intro',
      params: { circleId: circle.id },
    });
  }

  function handleOpen(circle: Circle) {
    if (!circle.introSeen) {
      router.push({ pathname: '/circle-intro', params: { circleId: circle.id } });
    } else {
      router.push({ pathname: '/circle', params: { circleId: circle.id, name: circle.name } });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Support Circles</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Small group spaces — 4 to 8 people — that feel safer than large public feeds.
        </Text>

        {loading && (
          <ActivityIndicator color={Colors.safeBlue} style={{ marginTop: Spacing.xl }} />
        )}

        {!loading && circles.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={42} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No circles available right now.</Text>
          </View>
        )}

        {!loading &&
          circles.map((c) => {
            const full = c.memberCount >= c.memberCap;
            return (
              <Card key={c.id} elevated style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: Colors.mutedLavender + '22' }]}>
                    <Ionicons name="people" size={22} color={Colors.mutedLavender} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>{c.name}</Text>
                    <Text style={styles.cardMembers}>
                      {c.memberCount} / {c.memberCap} members
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>{c.description}</Text>

                {c.isMember ? (
                  <TouchableOpacity
                    style={styles.openBtn}
                    onPress={() => handleOpen(c)}
                    accessibilityLabel={`Open ${c.name}`}
                    testID={`open-circle-${c.slug}`}
                  >
                    <Ionicons name="chatbubbles-outline" size={16} color={Colors.white} />
                    <Text style={styles.openBtnText}>Open circle</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.joinBtn, full && styles.joinBtnDisabled]}
                    onPress={() => !full && handleJoin(c)}
                    disabled={full || joiningId === c.id}
                    accessibilityLabel={full ? `${c.name} is full` : `Join ${c.name}`}
                    testID={`join-circle-${c.slug}`}
                  >
                    {joiningId === c.id ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name={full ? 'lock-closed-outline' : 'add-circle-outline'}
                          size={16}
                          color={Colors.white}
                        />
                        <Text style={styles.joinBtnText}>{full ? 'Circle full' : 'Join circle'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </Card>
            );
          })}

        <Card style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.softGreen} />
          <Text style={styles.safetyText}>
            Circles are small on purpose. You can leave or report anytime.
          </Text>
        </Card>
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
  navBtn: { width: 32, padding: Spacing.xs },
  navTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  intro: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xs },
  empty: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  card: { gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardMembers: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.safeBlue,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  joinBtnDisabled: { backgroundColor: Colors.textMuted },
  joinBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.softGreen,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  openBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  safetyNote: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.softGreen + '18',
    marginTop: Spacing.md,
  },
  safetyText: { flex: 1, fontSize: 13, color: Colors.softGreen, fontWeight: '500' },
});

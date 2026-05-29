import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { ConnectionsSection } from '@/components/social/ConnectionsSection';
import { IncomingLikesSection } from '@/components/social/IncomingLikesSection';
import { MatchCard } from '@/components/social/MatchCard';
import { PendingSection } from '@/components/social/PendingSection';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useConnectScreen } from '@/hooks/useConnectScreen';
import { INTENTIONS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ConnectScreen() {
  const {
    view,
    loading,
    currentPeer,
    candidatesCount,
    intentionObj,
    myMatches,
    pendingOutgoing,
    incomingLikes,
    unreadByMatch,
    handleSelectIntention,
    handleConnect,
    handleAcceptLike,
    handleDeclineLike,
    handleCancelPending,
    handleUnmatch,
    handlePass,
    handleBackToIntentions,
  } = useConnectScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Connect</Text>

        {view === 'intentions' && (
          <>
            <Text style={styles.subtitle}>Who would help most today?</Text>
            <View style={styles.grid}>
              {INTENTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.intentionCard}
                  onPress={() => handleSelectIntention(item.id)}
                  activeOpacity={0.75}
                  accessibilityLabel={item.label}
                  testID={`intention-${item.id}`}
                >
                  <View style={[styles.intentionIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as any} size={26} color={item.color} />
                  </View>
                  <Text style={styles.intentionLabel}>{item.label}</Text>
                  <Text style={styles.intentionDesc}>{item.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {(view === 'browsing' || view === 'empty') && (
          <View style={styles.browseHeader}>
            <TouchableOpacity
              onPress={handleBackToIntentions}
              style={styles.backBtn}
              accessibilityLabel="Change intention"
            >
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            {intentionObj && (
              <View style={[styles.intentionBadge, { backgroundColor: intentionObj.color + '22' }]}>
                <Ionicons name={intentionObj.icon as any} size={14} color={intentionObj.color} />
                <Text style={[styles.intentionBadgeText, { color: intentionObj.color }]}>
                  {intentionObj.label}
                </Text>
              </View>
            )}
          </View>
        )}

        {loading && <ActivityIndicator color={Colors.safeBlue} style={styles.loader} />}

        {view === 'browsing' && !loading && currentPeer && (
          <MatchCard
            peer={currentPeer}
            remaining={candidatesCount}
            onConnect={handleConnect}
            onPass={handlePass}
          />
        )}

        {view === 'empty' && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No more matches right now.</Text>
            <Text style={styles.emptyText}>Check back later — new people join every day.</Text>
            <TouchableOpacity onPress={handleBackToIntentions} style={styles.resetBtn}>
              <Text style={styles.resetText}>Try a different intention</Text>
            </TouchableOpacity>
          </View>
        )}

        <IncomingLikesSection
          matches={incomingLikes}
          onAccept={handleAcceptLike}
          onDecline={handleDeclineLike}
        />
        <ConnectionsSection
          matches={myMatches}
          unreadByMatch={unreadByMatch}
          onUnmatch={handleUnmatch}
        />
        <PendingSection matches={pendingOutgoing} onCancel={handleCancelPending} />

        <TouchableOpacity
          style={styles.circlesEntry}
          onPress={() => router.push('/circles')}
          activeOpacity={0.85}
          accessibilityLabel="Browse support circles"
          testID="circles-entry"
        >
          <View style={styles.circlesEntryIcon}>
            <Ionicons name="people" size={22} color={Colors.mutedLavender} />
          </View>
          <View style={styles.circlesEntryText}>
            <Text style={styles.circlesEntryTitle}>Support circles</Text>
            <Text style={styles.circlesEntrySub}>
              Small groups of 4–8 people. Safer than public feeds.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <Card style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.softGreen} />
          <Text style={styles.safetyText}>
            All connections are anonymous. You can block or report anyone at any time.
          </Text>
        </Card>
      </ScrollView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 16, color: Colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  intentionCard: {
    width: '47%',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  intentionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  intentionLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  intentionDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },
  browseHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backBtn: { padding: 4 },
  intentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  intentionBadgeText: { fontSize: 13, fontWeight: '600' },
  loader: { marginTop: Spacing.xl },
  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  resetBtn: { marginTop: Spacing.sm },
  resetText: { fontSize: 14, color: Colors.safeBlue, fontWeight: '600', textDecorationLine: 'underline' },
  circlesEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  circlesEntryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.mutedLavender + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlesEntryText: { flex: 1 },
  circlesEntryTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  circlesEntrySub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.softGreen + '12',
    borderLeftWidth: 3,
    borderLeftColor: Colors.softGreen,
  },
  safetyText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});


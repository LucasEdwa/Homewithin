import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { GuestBlock } from '@/components/social/GuestBlock';
import { ConnectionsSection } from '@/components/social/ConnectionsSection';
import { IncomingLikesSection } from '@/components/social/IncomingLikesSection';
import { MatchCard } from '@/components/social/MatchCard';
import { MatchCelebration } from '@/components/social/MatchCelebration';
import { PendingSection } from '@/components/social/PendingSection';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { useConnectScreen } from '@/hooks/useConnectScreen';
import { INTENTIONS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { profile } = useSession();
  const [activeTab, setActiveTab] = useState<'connected' | 'pending'>('connected');

  const intentions = INTENTIONS.map((item) => ({
    ...item,
    label: t(`intentions.${item.id}.label` as any),
    description: t(`intentions.${item.id}.description` as any),
  }));
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
    celebrationMatch,
    dismissCelebration,
    handleSelectIntention,
    handleConnect,
    handleAcceptLike,
    handleDeclineLike,
    handleCancelPending,
    handleUnmatch,
    handlePass,
    handleBackToIntentions,
    handleReport,
  } = useConnectScreen();

  if (profile?.isAnonymous) {
    return (
      <SafeAreaView style={styles.safe}>
        <GuestBlock />
        <EmergencyButton />
      </SafeAreaView>
    );
  }

  const pendingCount = incomingLikes.length + pendingOutgoing.length;
  const showTabs = myMatches.length > 0 || pendingCount > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('connect.title')}</Text>

        {view === 'intentions' && (
          <>
            <Text style={styles.subtitle}>{t('connect.whoHelps')}</Text>
            <View style={styles.grid}>
              {intentions.map((item) => (
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
              accessibilityLabel={t('connect.changeIntention')}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            {intentionObj && (
              <View style={[styles.intentionBadge, { backgroundColor: intentionObj.color + '22' }]}>
                <Ionicons name={intentionObj.icon as any} size={14} color={intentionObj.color} />
                <Text style={[styles.intentionBadgeText, { color: intentionObj.color }]}>
                  {t(`intentions.${intentionObj.id}.label` as any)}
                </Text>
              </View>
            )}
          </View>
        )}

        {loading && <ActivityIndicator color={Colors.safeBlue} style={styles.loader} />}

        {view === 'browsing' && !loading && currentPeer && (
          <MatchCard
            key={currentPeer.userId}
            peer={currentPeer}
            remaining={candidatesCount}
            onConnect={handleConnect}
            onPass={handlePass}
            onReport={handleReport}
          />
        )}

        {view === 'empty' && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('connect.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('connect.emptyBody')}</Text>
            <TouchableOpacity onPress={handleBackToIntentions} style={styles.resetBtn}>
              <Text style={styles.resetText}>{t('connect.tryDifferent')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showTabs && (
          <View style={styles.tabsContainer}>
            {/* Tab bar */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'connected' && styles.tabActive]}
                onPress={() => setActiveTab('connected')}
                accessibilityLabel="Connected tab"
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'connected' }}
              >
                <Ionicons
                  name="people"
                  size={15}
                  color={activeTab === 'connected' ? Colors.safeBlue : Colors.textMuted}
                />
                <Text style={[styles.tabText, activeTab === 'connected' && styles.tabTextActive]}>
                  {t('connect.connected')}
                </Text>
                {myMatches.length > 0 && (
                  <View style={[styles.tabBadge, activeTab === 'connected' && styles.tabBadgeActive]}>
                    <Text style={styles.tabBadgeText}>{myMatches.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
                onPress={() => setActiveTab('pending')}
                accessibilityLabel="Pending tab"
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'pending' }}
              >
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={activeTab === 'pending' ? Colors.safeBlue : Colors.textMuted}
                />
                <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                  {t('connect.pending')}
                </Text>
                {pendingCount > 0 && (
                  <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActive]}>
                    <Text style={styles.tabBadgeText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Tab content */}
            {activeTab === 'connected' && (
              myMatches.length > 0
                ? <ConnectionsSection
                    matches={myMatches}
                    unreadByMatch={unreadByMatch}
                    onUnmatch={handleUnmatch}
                  />
                : <View style={styles.tabEmpty}>
                    <Ionicons name="people-outline" size={36} color={Colors.textMuted} />
                    <Text style={styles.tabEmptyTitle}>{t('connect.noConnections')}</Text>
                    <Text style={styles.tabEmptyText}>{t('connect.noConnectionsBody')}</Text>
                  </View>
            )}

            {activeTab === 'pending' && (
              pendingCount > 0
                ? <View style={styles.pendingContent}>
                    <IncomingLikesSection
                      matches={incomingLikes}
                      onAccept={handleAcceptLike}
                      onDecline={handleDeclineLike}
                    />
                    <PendingSection matches={pendingOutgoing} onCancel={handleCancelPending} />
                  </View>
                : <View style={styles.tabEmpty}>
                    <Ionicons name="time-outline" size={36} color={Colors.textMuted} />
                    <Text style={styles.tabEmptyTitle}>{t('connect.nothingPending')}</Text>
                    <Text style={styles.tabEmptyText}>{t('connect.nothingPendingBody')}</Text>
                  </View>
            )}
          </View>
        )}

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
            <Text style={styles.circlesEntryTitle}>{t('connect.supportCircles')}</Text>
            <Text style={styles.circlesEntrySub}>{t('connect.supportCirclesSub')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <Card style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.softGreen} />
          <Text style={styles.safetyText}>{t('connect.safetyNote')}</Text>
        </Card>
      </ScrollView>
      <EmergencyButton />
      {celebrationMatch && (
        <MatchCelebration
          peer={celebrationMatch.peer}
          matchId={celebrationMatch.matchId}
          onClose={dismissCelebration}
        />
      )}
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
  tabsContainer: { gap: Spacing.md },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: Colors.warmWhite,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.textPrimary },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: Colors.safeBlue },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  tabEmpty: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xl,
  },
  tabEmptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tabEmptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  pendingContent: { gap: Spacing.lg },
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


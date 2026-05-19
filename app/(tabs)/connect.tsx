import { EmergencyButton } from '@/components/EmergencyButton';
import { Card } from '@/components/ui/Card';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import {
  acceptIncomingLike,
  connectMatch,
  declineIncomingLike,
  findMatches,
  getIncomingLikes,
  getMyMatches,
  getPendingOutgoing,
  passMatch,
  syncProfile,
} from '@/services/matching';
import type { IntentionId, Match, PeerProfile } from '@/types';
import { INTENTIONS } from '@/types';
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

type View_ = 'intentions' | 'browsing' | 'empty';

export default function ConnectScreen() {
  const { profile } = useSession();
  const [view, setView] = useState<View_>('intentions');
  const [intention, setIntention] = useState<IntentionId | null>(null);
  const [candidates, setCandidates] = useState<PeerProfile[]>([]);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<Match[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [browsing, setBrowsing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (profile) await syncProfile(profile);
        const [matches, pending, incoming] = await Promise.all([
          getMyMatches(),
          getPendingOutgoing(),
          getIncomingLikes(),
        ]);
        setMyMatches(matches);
        setPendingOutgoing(pending);
        setIncomingLikes(incoming);
      })();
    }, [profile])
  );

  async function refreshMatchLists() {
    const [matches, pending, incoming] = await Promise.all([
      getMyMatches(),
      getPendingOutgoing(),
      getIncomingLikes(),
    ]);
    setMyMatches(matches);
    setPendingOutgoing(pending);
    setIncomingLikes(incoming);
  }

  async function handleSelectIntention(id: IntentionId) {
    setIntention(id);
    setBrowsing(true);
    setLoading(true);
    const results = await findMatches(id);
    setCandidates(results);
    setLoading(false);
    setView(results.length > 0 ? 'browsing' : 'empty');
  }

  async function handleConnect() {
    if (!intention || candidates.length === 0) return;
    const [peer, ...rest] = candidates;
    const { matchId, mutual } = await connectMatch(peer.userId, intention);

    if (mutual && matchId) {
      await refreshMatchLists();
      Alert.alert(
        "It's a match! 🎉",
        `You and ${peer.nickname} both want to connect. Say hi!`,
        [
          {
            text: 'Open chat',
            onPress: () => router.push({ pathname: '/chat', params: { matchId, nickname: peer.nickname } }),
          },
          { text: 'Later' },
        ]
      );
    } else {
      await refreshMatchLists();
    }

    if (rest.length > 0) {
      setCandidates(rest);
    } else {
      setView('empty');
    }
  }

  async function handleAcceptLike(match: Match) {
    const ok = await acceptIncomingLike(match.id);
    if (ok) {
      await refreshMatchLists();
      Alert.alert(
        "It's a match! 🎉",
        `You and ${match.peer?.nickname ?? 'someone'} are now connected.`,
        [
          {
            text: 'Open chat',
            onPress: () => router.push({ pathname: '/chat', params: { matchId: match.id, nickname: match.peer?.nickname ?? 'Someone' } }),
          },
          { text: 'Later' },
        ]
      );
    }
  }

  async function handleDeclineLike(match: Match) {
    await declineIncomingLike(match.id);
    await refreshMatchLists();
  }

  async function handlePass() {
    if (!intention || candidates.length === 0) return;
    const [peer, ...rest] = candidates;
    await passMatch(peer.userId, intention);
    if (rest.length > 0) {
      setCandidates(rest);
    } else {
      setView('empty');
    }
  }

  function handleBackToIntentions() {
    setView('intentions');
    setIntention(null);
    setCandidates([]);
    setBrowsing(false);
  }

  const currentPeer = candidates[0];
  const intentionObj = INTENTIONS.find((i) => i.id === intention);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Connect</Text>

        {/* Intentions panel */}
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

        {/* Match browsing */}
        {(view === 'browsing' || view === 'empty') && (
          <View style={styles.browseHeader}>
            <TouchableOpacity onPress={handleBackToIntentions} style={styles.backBtn} accessibilityLabel="Change intention">
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            {intentionObj && (
              <View style={[styles.intentionBadge, { backgroundColor: intentionObj.color + '22' }]}>
                <Ionicons name={intentionObj.icon as any} size={14} color={intentionObj.color} />
                <Text style={[styles.intentionBadgeText, { color: intentionObj.color }]}>{intentionObj.label}</Text>
              </View>
            )}
          </View>
        )}

        {loading && (
          <ActivityIndicator color={Colors.safeBlue} style={styles.loader} />
        )}

        {view === 'browsing' && !loading && currentPeer && (
          <MatchCard
            peer={currentPeer}
            remaining={candidates.length}
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

        {/* Incoming likes — people waiting for your response */}
        {incomingLikes.length > 0 && (
          <View style={styles.connectionsSection}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>People who liked you</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{incomingLikes.length}</Text>
              </View>
            </View>
            {incomingLikes.map((match) => (
              <View key={match.id} style={styles.connectionRow} testID={`incoming-${match.id}`}>
                <View style={[styles.avatar, { backgroundColor: Colors.mutedLavender }]}>
                  <Text style={styles.avatarText}>{(match.peer?.nickname?.[0] ?? '?').toUpperCase()}</Text>
                </View>
                <View style={styles.connectionInfo}>
                  <Text style={styles.connectionName}>{match.peer?.nickname ?? 'Someone'}</Text>
                  {match.peer?.country ? (
                    <Text style={styles.connectionMeta}>{match.peer.country}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => handleDeclineLike(match)}
                  accessibilityLabel="Decline"
                  testID={`decline-${match.id}`}
                >
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAcceptLike(match)}
                  accessibilityLabel="Accept"
                  testID={`accept-${match.id}`}
                >
                  <Ionicons name="heart" size={16} color={Colors.white} />
                  <Text style={styles.acceptBtnText}>Connect</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Mutual connections — chat enabled */}
        {myMatches.length > 0 && (
          <View style={styles.connectionsSection}>
            <Text style={styles.sectionTitle}>Your connections</Text>
            {myMatches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={styles.connectionRow}
                onPress={() => router.push({ pathname: '/chat', params: { matchId: match.id, nickname: match.peer?.nickname ?? 'Someone' } })}
                accessibilityLabel={`Chat with ${match.peer?.nickname ?? 'Someone'}`}
                testID={`match-${match.id}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(match.peer?.nickname?.[0] ?? '?').toUpperCase()}</Text>
                </View>
                <View style={styles.connectionInfo}>
                  <Text style={styles.connectionName}>{match.peer?.nickname ?? 'Someone'}</Text>
                  {match.peer?.country ? (
                    <Text style={styles.connectionMeta}>{match.peer.country}</Text>
                  ) : null}
                </View>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.safeBlue} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pending outgoing likes — waiting for the other person */}
        {pendingOutgoing.length > 0 && (
          <View style={styles.connectionsSection}>
            <Text style={styles.sectionTitle}>Waiting for response</Text>
            {pendingOutgoing.map((match) => (
              <View key={match.id} style={[styles.connectionRow, styles.pendingRow]} testID={`pending-${match.id}`}>
                <View style={[styles.avatar, { backgroundColor: Colors.border }]}>
                  <Text style={[styles.avatarText, { color: Colors.textMuted }]}>{(match.peer?.nickname?.[0] ?? '?').toUpperCase()}</Text>
                </View>
                <View style={styles.connectionInfo}>
                  <Text style={styles.connectionName}>{match.peer?.nickname ?? 'Someone'}</Text>
                  <Text style={styles.connectionMeta}>Waiting for them to connect back…</Text>
                </View>
                <Ionicons name="time-outline" size={18} color={Colors.textMuted} />
              </View>
            ))}
          </View>
        )}

        {/* Support circles entry */}
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
            <Text style={styles.circlesEntrySub}>Small groups of 4–8 people. Safer than public feeds.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Safety note */}
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

function MatchCard({
  peer,
  remaining,
  onConnect,
  onPass,
}: {
  peer: PeerProfile;
  remaining: number;
  onConnect: () => void;
  onPass: () => void;
}) {
  return (
    <Card elevated style={styles.matchCard}>
      {peer.avatarUrl ? (
        <Image
          source={{ uri: peer.avatarUrl }}
          style={styles.matchAvatarImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.matchAvatar}>
          <Text style={styles.matchAvatarText}>{(peer.nickname[0] ?? '?').toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.matchNickname}>{peer.nickname}</Text>

      <View style={styles.matchMeta}>
        {peer.ageRange ? (
          <View style={styles.metaChip}>
            <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaChipText}>{peer.ageRange}</Text>
          </View>
        ) : null}
        {peer.country ? (
          <View style={styles.metaChip}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaChipText}>{peer.country}</Text>
          </View>
        ) : null}
        {peer.language ? (
          <View style={styles.metaChip}>
            <Ionicons name="language-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaChipText}>{peer.language}</Text>
          </View>
        ) : null}
      </View>

      {peer.needs.length > 0 && (
        <View style={styles.needsRow}>
          {peer.needs.slice(0, 3).map((need) => (
            <View key={need} style={styles.needChip}>
              <Text style={styles.needChipText}>{need.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.remainingText}>{remaining} potential {remaining === 1 ? 'match' : 'matches'}</Text>

      <View style={styles.matchActions}>
        <TouchableOpacity style={styles.passBtn} onPress={onPass} accessibilityLabel="Pass" testID="pass-btn">
          <Ionicons name="close" size={28} color={Colors.textMuted} />
          <Text style={styles.passBtnText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.connectBtn} onPress={onConnect} accessibilityLabel="Connect" testID="connect-btn">
          <Ionicons name="heart" size={28} color={Colors.white} />
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </Card>
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
  matchCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  matchAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  matchAvatarText: { fontSize: 36, fontWeight: '700', color: Colors.white },
  matchNickname: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  matchMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.softGray,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  metaChipText: { fontSize: 12, color: Colors.textMuted },
  needsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' },
  needChip: {
    backgroundColor: Colors.softGreen + '22',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  needChipText: { fontSize: 12, color: Colors.softGreen, fontWeight: '600' },
  remainingText: { fontSize: 12, color: Colors.textMuted },
  matchActions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  passBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.softGray,
    gap: 2,
  },
  passBtnText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  connectBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.safeBlue,
    gap: 2,
  },
  connectBtnText: { fontSize: 11, color: Colors.white, fontWeight: '700' },
  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  resetBtn: { marginTop: Spacing.sm },
  resetText: { fontSize: 14, color: Colors.safeBlue, fontWeight: '600', textDecorationLine: 'underline' },
  connectionsSection: { gap: Spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  connectionInfo: { flex: 1 },
  connectionName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  connectionMeta: { fontSize: 12, color: Colors.textMuted },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.softGreen + '12',
    borderLeftWidth: 3,
    borderLeftColor: Colors.softGreen,
  },
  safetyText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  circlesEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  circlesEntryIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.mutedLavender + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  circlesEntryText: { flex: 1 },
  circlesEntryTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  circlesEntrySub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.mutedLavender,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.safeBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  acceptBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  pendingRow: { opacity: 0.7 },
});

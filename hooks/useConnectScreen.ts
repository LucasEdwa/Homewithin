import { useSession } from '@/context/SessionContext';
import { useUnread } from '@/context/UnreadContext';
import { useMatches } from '@/hooks/useMatches';
import {
  acceptIncomingLike,
  blockUser,
  cancelPendingMatch,
  connectMatch,
  declineIncomingLike,
  findMatches,
  passMatch,
  reportUser,
  unmatch,
} from '@/services/social/matching';
import type { IntentionId, Match, PeerProfile } from '@/types';
import { INTENTIONS } from '@/types';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

export type ConnectView = 'intentions' | 'browsing' | 'empty';

export interface CelebrationMatch {
  peer: PeerProfile;
  matchId: string;
}

export function useConnectScreen() {
  const { profile } = useSession();
  const { unreadByMatch } = useUnread();
  const { myMatches, pendingOutgoing, incomingLikes, refreshMatchLists } = useMatches();
  const [view, setView] = useState<ConnectView>('intentions');
  const [intention, setIntention] = useState<IntentionId | null>(null);
  const [candidates, setCandidates] = useState<PeerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [celebrationMatch, setCelebrationMatch] = useState<CelebrationMatch | null>(null);

  async function handleSelectIntention(id: IntentionId) {
    if (profile?.isAnonymous) return;
    setIntention(id);
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
      setCelebrationMatch({ peer, matchId });
    } else {
      await refreshMatchLists();
    }

    setCandidates(rest);
    if (rest.length === 0) setView('empty');
  }

  async function handleAcceptLike(match: Match) {
    const ok = await acceptIncomingLike(match.id, match.requesterId);
    if (ok) {
      await refreshMatchLists();
      if (match.peer) {
        setCelebrationMatch({ peer: match.peer, matchId: match.id });
      }
    }
  }

  async function handleDeclineLike(match: Match) {
    await declineIncomingLike(match.id);
    await refreshMatchLists();
  }

  function handleCancelPending(match: Match) {
    Alert.alert(
      'Cancel request?',
      `This will withdraw your connection request to ${match.peer?.nickname ?? 'this person'}.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: async () => {
            await cancelPendingMatch(match.id);
            await refreshMatchLists();
          },
        },
      ],
    );
  }

  function handleUnmatch(match: Match) {
    Alert.alert(
      'Unmatch?',
      `You and ${match.peer?.nickname ?? 'this person'} will no longer be connected.`,
      [
        { text: 'Keep connection', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            await unmatch(match.id);
            await refreshMatchLists();
          },
        },
      ],
    );
  }

  async function handlePass() {
    if (!intention || candidates.length === 0) return;
    const [peer, ...rest] = candidates;
    await passMatch(peer.userId, intention);
    setCandidates(rest);
    if (rest.length === 0) setView('empty');
  }

  function handleBackToIntentions() {
    setView('intentions');
    setIntention(null);
    setCandidates([]);
  }

  function handleReport() {
    if (candidates.length === 0) return;
    const peer = candidates[0];

    const doBlockAndReport = async () => {
      await blockUser(peer.userId);
      await reportUser(peer.userId, 'Blocked and reported from browse screen');
      const rest = candidates.slice(1);
      setCandidates(rest);
      if (rest.length === 0) setView('empty');
      Alert.alert('Blocked', `${peer.nickname} has been blocked and reported.`);
    };

    const doReport = async () => {
      await reportUser(peer.userId, 'Reported from browse screen');
      const rest = candidates.slice(1);
      setCandidates(rest);
      if (rest.length === 0) setView('empty');
      Alert.alert('Reported', "Thank you. We'll review this shortly.");
    };

    const options = ['Block & report', 'Report only', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 0, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) doBlockAndReport();
          if (idx === 1) doReport();
        },
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Block & report', style: 'destructive', onPress: doBlockAndReport },
        { text: 'Report only', onPress: doReport },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  return {
    view,
    loading,
    currentPeer: candidates[0] as PeerProfile | undefined,
    candidatesCount: candidates.length,
    intentionObj: INTENTIONS.find((i) => i.id === intention),
    myMatches,
    pendingOutgoing,
    incomingLikes,
    unreadByMatch,
    celebrationMatch,
    dismissCelebration: () => setCelebrationMatch(null),
    handleSelectIntention,
    handleConnect,
    handleAcceptLike,
    handleDeclineLike,
    handleCancelPending,
    handleUnmatch,
    handlePass,
    handleBackToIntentions,
    handleReport,
  };
}

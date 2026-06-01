import { useUnread } from '@/context/UnreadContext';
import { useMatches } from '@/hooks/useMatches';
import {
  acceptIncomingLike,
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
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export type ConnectView = 'intentions' | 'browsing' | 'empty';

export function useConnectScreen() {
  const { unreadByMatch } = useUnread();
  const { myMatches, pendingOutgoing, incomingLikes, refreshMatchLists } = useMatches();
  const [view, setView] = useState<ConnectView>('intentions');
  const [intention, setIntention] = useState<IntentionId | null>(null);
  const [candidates, setCandidates] = useState<PeerProfile[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSelectIntention(id: IntentionId) {
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
      Alert.alert(
        "It's a match! 🎉",
        `You and ${peer.nickname} both want to connect. Say hi!`,
        [
          {
            text: 'Open chat',
            onPress: () =>
              router.push({
                pathname: '/chat',
                params: { matchId, nickname: peer.nickname, avatarUrl: peer.avatarUrl ?? '' },
              }),
          },
          { text: 'Later' },
        ],
      );
    } else {
      await refreshMatchLists();
    }

    setCandidates(rest);
    if (rest.length === 0) setView('empty');
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
            onPress: () =>
              router.push({
                pathname: '/chat',
                params: {
                  matchId: match.id,
                  nickname: match.peer?.nickname ?? 'Someone',
                  avatarUrl: match.peer?.avatarUrl ?? '',
                },
              }),
          },
          { text: 'Later' },
        ],
      );
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
    Alert.alert(
      `Report ${peer.nickname}?`,
      'Briefly describe the issue (e.g. inappropriate profile, harassment):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            await reportUser(peer.userId, 'Reported from browse screen');
            // Skip to the next candidate after reporting.
            const rest = candidates.slice(1);
            setCandidates(rest);
            if (rest.length === 0) setView('empty');
            Alert.alert('Reported', "Thank you. We'll review this shortly.");
          },
        },
      ],
    );
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

import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSwipeCard } from '@/hooks/useSwipeCard';
import type { PeerProfile } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

interface Props {
  peer: PeerProfile;
  remaining: number;
  onConnect: () => void;
  onPass: () => void;
  onReport?: () => void;
}

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon as any} size={11} color={Colors.textMuted} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function MatchCard({ peer, remaining, onConnect, onPass, onReport }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = (peer.nickname?.[0] ?? '?').toUpperCase();
  const hasImage = !!peer.avatarUrl && !imageFailed;

  const { pan, cardStyle, likeStyle, skipStyle } = useSwipeCard({
    peerId: peer.userId,
    onSwipeRight: onConnect,
    onSwipeLeft: onPass,
  });

  // Compose with a NativeGesture so buttons inside still fire
  const composed = Gesture.Simultaneous(pan);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.card, cardStyle]}>

        {/* ── Hero image ── */}
        <View style={styles.imageContainer}>
          {hasImage ? (
            <Image
              source={{ uri: peer.avatarUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={styles.fallback}>
              <Text style={styles.fallbackInitial}>{initial}</Text>
            </View>
          )}

          {/* LIKE badge — fades in on right swipe */}
          <Animated.View
            style={[styles.swipeBadge, styles.likeBadge, likeStyle]}
            pointerEvents="none"
          >
            <Ionicons name="heart" size={18} color={Colors.softGreen} />
            <Text style={[styles.swipeBadgeText, { color: Colors.softGreen }]}>LIKE</Text>
          </Animated.View>

          {/* SKIP badge — fades in on left swipe */}
          <Animated.View
            style={[styles.swipeBadge, styles.skipBadge, skipStyle]}
            pointerEvents="none"
          >
            <Ionicons name="close" size={18} color={Colors.alertRed} />
            <Text style={[styles.swipeBadgeText, { color: Colors.alertRed }]}>SKIP</Text>
          </Animated.View>

          {/* Top bar: count + report */}
          <View style={styles.imageTopBar}>
            <View style={styles.countBadge}>
              <Ionicons name="people" size={11} color="#fff" />
              <Text style={styles.countText}>
                {remaining} {remaining === 1 ? 'person' : 'people'} nearby
              </Text>
            </View>
            {onReport && (
              <TouchableOpacity
                onPress={onReport}
                style={styles.reportBtn}
                accessibilityLabel="More options"
                testID="report-profile-btn"
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom scrim */}
          <View style={styles.scrim} pointerEvents="none">
            <View style={styles.scrimInner} />
          </View>
        </View>

        {/* ── Info section ── */}
        <View style={styles.info}>
          <Text style={styles.nickname} numberOfLines={1}>{peer.nickname}</Text>

          <View style={styles.metaRow}>
            {peer.ageRange ? <InfoChip icon="person-outline" label={peer.ageRange} /> : null}
            {peer.country ? <InfoChip icon="location-outline" label={peer.country} /> : null}
            {peer.language ? <InfoChip icon="language-outline" label={peer.language} /> : null}
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
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.passBtn}
            onPress={onPass}
            accessibilityLabel="Pass"
            testID="pass-btn"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
            <Text style={styles.passBtnText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.connectBtn}
            onPress={onConnect}
            accessibilityLabel="Connect"
            testID="connect-btn"
            activeOpacity={0.85}
          >
            <Ionicons name="heart" size={22} color={Colors.warmWhite} />
            <Text style={styles.connectBtnText}>Connect</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  // ── Image ──────────────────────────────────────────────────
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#1E1B19',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.mutedLavender + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    fontSize: 96,
    fontWeight: '700',
    color: Colors.mutedLavender,
    opacity: 0.5,
  },
  imageTopBar: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  countText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  reportBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  scrimInner: {
    flex: 1,
    backgroundColor: 'rgba(15,13,12,0.6)',
  },

  // ── Swipe badges ──────────────────────────────────────────
  swipeBadge: {
    position: 'absolute',
    top: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 2.5,
    backgroundColor: 'rgba(15,13,12,0.55)',
  },
  likeBadge: {
    left: Spacing.md,
    borderColor: Colors.softGreen,
  },
  skipBadge: {
    right: Spacing.md,
    borderColor: Colors.alertRed,
  },
  swipeBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // ── Info ──────────────────────────────────────────────────
  info: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: 8,
  },
  nickname: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  needsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  needChip: {
    backgroundColor: Colors.mutedLavender + '18',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.mutedLavender + '35',
  },
  needChipText: {
    fontSize: 12,
    color: Colors.mutedLavender,
    fontWeight: '500',
  },

  // ── Actions ───────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  passBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  passBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  connectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.softGreen,
    shadowColor: Colors.softGreen,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  connectBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
});

import { Colors } from '@/constants/Colors';
import { SESSION_DURATION_MINUTES } from '@/constants/ProfessionalSupport';
import { Radius, Spacing } from '@/constants/Spacing';
import { getProfessional } from '@/services/professional/directory';
import { bookSession } from '@/services/professional/booking';
import { type ProfessionalProfile } from '@/types/professional';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return `${DAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimeRange(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function CheckoutSummaryScreen() {
  const { professionalId, scheduledAt } = useLocalSearchParams<{
    professionalId: string;
    scheduledAt: string;
  }>();

  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!professionalId) return;
    getProfessional(professionalId)
      .then((p) => {
        setProfessional(p);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [professionalId]);

  async function handleConfirm() {
    if (!professionalId || !scheduledAt || !professional) return;
    setConfirming(true);
    try {
      const session = await bookSession(professionalId, scheduledAt);
      // Navigate to Stripe checkout (Sprint 4). Pass the new session ID.
      router.replace(`/(professional)/checkout?sessionId=${session.id}` as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Booking failed. Please try again.';
      Alert.alert('Could not book session', msg);
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.safeBlue} style={{ marginTop: Spacing.xl }} />
      </SafeAreaView>
    );
  }

  if (error || !professional || !scheduledAt) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.errorText}>{error ?? 'Could not load booking details.'}</Text>
      </SafeAreaView>
    );
  }

  const priceSek = (professional.sessionPriceSekOre / 100).toFixed(0);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          disabled={confirming}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Professional card */}
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {professional.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.professionalInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.professionalName}>{professional.displayName}</Text>
              {professional.licenseVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#fff" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.professionalTitle}>{professional.title}</Text>
          </View>
        </View>

        {/* Session details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Session Details</Text>

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="calendar-outline" size={18} color={Colors.safeBlue} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Date</Text>
              <Text style={styles.rowValue}>{formatFullDate(scheduledAt)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="time-outline" size={18} color={Colors.safeBlue} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Time</Text>
              <Text style={styles.rowValue}>
                {formatTimeRange(scheduledAt, SESSION_DURATION_MINUTES)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="hourglass-outline" size={18} color={Colors.safeBlue} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Duration</Text>
              <Text style={styles.rowValue}>{SESSION_DURATION_MINUTES} minutes</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="videocam-outline" size={18} color={Colors.safeBlue} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Format</Text>
              <Text style={styles.rowValue}>Video call (Jitsi)</Text>
            </View>
          </View>
        </View>

        {/* Price breakdown */}
        <View style={styles.priceCard}>
          <Text style={styles.detailsTitle}>Payment</Text>
          <View style={styles.priceLine}>
            <Text style={styles.priceLineLabel}>Session fee</Text>
            <Text style={styles.priceLineValue}>{priceSek} SEK</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{priceSek} SEK</Text>
          </View>
        </View>

        {/* Cancellation notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.noticeText}>
            Free cancellation up to 24 hours before the session. After that, no refund is issued.
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={confirming}
          activeOpacity={0.8}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color="#fff" />
              <Text style={styles.confirmBtnText}>Continue to Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  backBtn: { width: 32 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  // Scroll
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 32 },
  // Professional card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  professionalInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  professionalName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  professionalTitle: { fontSize: 13, color: Colors.textMuted },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.safeBlue,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  verifiedText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  // Detail cards
  detailsCard: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  rowIcon: { paddingTop: 1 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  rowValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border },
  // Price card
  priceCard: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLineLabel: { fontSize: 15, color: Colors.textPrimary },
  priceLineValue: { fontSize: 15, color: Colors.textPrimary },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 20, fontWeight: '800', color: Colors.softGreen },
  // Notice
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeText: { flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  // Footer CTA
  footer: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.softGreen,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: Colors.warmWhite, fontSize: 16, fontWeight: '700' },
  // Error
  errorText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
  },
});

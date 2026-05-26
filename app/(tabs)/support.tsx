import { Colors } from '@/constants/Colors';
import { PROFESSIONAL_SUPPORT_BETA_ENABLED } from '@/constants/ProfessionalSupport';
import { Radius, Spacing } from '@/constants/Spacing';
import {
    listProfessionals,
    type ListProfessionalsFilter,
} from '@/services/professional/directory';
import { SPECIALTY_LABELS, type ProfessionalProfile, type Specialty } from '@/types/professional';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const ALL = 'all' as const;
type Filter = Specialty | typeof ALL;

const FILTERS: { key: Filter; label: string }[] = [
  { key: ALL, label: 'All' },
  ...Object.entries(SPECIALTY_LABELS).map(([key, label]) => ({
    key: key as Specialty,
    label,
  })),
];

// ─── Coming Soon ─────────────────────────────────────────────────────────────

function ComingSoon() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.comingSoonContainer}>
        <View style={styles.betaBadge}>
          <Text style={styles.betaBadgeText}>COMING SOON</Text>
        </View>
        <Ionicons name="medal-outline" size={56} color={Colors.textMuted} style={{ marginBottom: Spacing.md }} />
        <Text style={styles.comingSoonTitle}>Find a Professional</Text>
        <Text style={styles.comingSoonBody}>
          Connect with LGBTQ+-affirming therapists and psychologists for
          private, secure video sessions. Launching soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Professional Card ────────────────────────────────────────────────────────

function ProfessionalCard({ professional }: { professional: ProfessionalProfile }) {
  const priceSek = (professional.sessionPriceSekOre / 100).toFixed(0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(professional)/profile?id=${professional.id}` as never)}
      activeOpacity={0.75}
    >
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>
          {professional.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{professional.displayName}</Text>
          {professional.licenseVerified && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.safeBlue} />
          )}
        </View>
        <Text style={styles.cardTitle}>{professional.title}</Text>
        <View style={styles.chipRow}>
          {professional.specialties.slice(0, 3).map((s) => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipText}>{SPECIALTY_LABELS[s]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.cardPrice}>{priceSek} SEK / session</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const [filter, setFilter] = useState<Filter>(ALL);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!PROFESSIONAL_SUPPORT_BETA_ENABLED) return;
      let active = true;
      setLoading(true);
      setError(null);
      const f: ListProfessionalsFilter = filter === ALL ? {} : { specialty: filter };
      listProfessionals(f)
        .then((data) => { if (active) { setProfessionals(data); setLoading(false); } })
        .catch((e: Error) => { if (active) { setError(e.message); setLoading(false); } });
      return () => { active = false; };
    }, [filter])
  );

  if (!PROFESSIONAL_SUPPORT_BETA_ENABLED) return <ComingSoon />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Find a Professional</Text>
      </View>

      {/* Specialty filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
        style={styles.filterScroll}
      >
        {FILTERS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
            onPress={() => setFilter(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={Colors.safeBlue} style={{ marginTop: Spacing.xl }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={professionals}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProfessionalCard professional={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No professionals found for this filter.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  // Coming soon
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  betaBadge: {
    backgroundColor: Colors.warmAmber,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginBottom: Spacing.lg,
  },
  betaBadgeText: { color: Colors.warmWhite, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  comingSoonTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  comingSoonBody: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginTop: Spacing.sm },
  // Header
  headerRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  // Filter bar
  filterScroll: { flexGrow: 0 },
  filterBar: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  filterChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.warmWhite,
  },
  filterChipActive: { backgroundColor: Colors.safeBlue, borderColor: Colors.safeBlue },
  filterChipText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  // List
  list: { padding: Spacing.lg, gap: Spacing.md },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl },
  errorText: { textAlign: 'center', color: Colors.alertRed, marginTop: Spacing.xl, padding: Spacing.lg },
  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  cardTitle: { fontSize: 12, color: Colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  chip: {
    borderRadius: Radius.full,
    backgroundColor: Colors.warmAmber + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
    chipText: { fontSize: 11, color: Colors.warmAmber, fontWeight: '600' },
  cardPrice: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});

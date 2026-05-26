import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { getProfessional } from '@/services/professional/directory';
import { SPECIALTY_LABELS, type ProfessionalProfile } from '@/types/professional';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfessionalProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProfessional(id)
      .then((p) => { setProfessional(p); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.safeBlue} style={{ marginTop: Spacing.xl }} />
      </SafeAreaView>
    );
  }

  if (error || !professional) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.errorText}>{error ?? 'Professional not found.'}</Text>
      </SafeAreaView>
    );
  }

  const priceSek = (professional.sessionPriceSekOre / 100).toFixed(0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Avatar + name */}
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {professional.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroName}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{professional.displayName}</Text>
              {professional.licenseVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>{professional.title}</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Session fee</Text>
          <Text style={styles.price}>{priceSek} SEK</Text>
          <Text style={styles.priceSub}>50 min video session</Text>
        </View>

        {/* Bio */}
        {professional.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.bio}>{professional.bio}</Text>
          </View>
        ) : null}

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Specialties</Text>
          <View style={styles.chipRow}>
            {professional.specialties.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{SPECIALTY_LABELS[s]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Languages */}
        {professional.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Languages</Text>
            <Text style={styles.languageText}>{professional.languages.join(', ')}</Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push(`/(professional)/book?id=${professional.id}` as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>Book a Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },
  backBtn: { marginBottom: Spacing.sm },
  errorText: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl, padding: Spacing.lg },
  // Hero
  heroSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.safeBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  heroName: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  title: { fontSize: 13, color: Colors.textMuted },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.safeBlue,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  // Price box
  priceBox: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  priceLabel: { fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  price: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  priceSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  // Sections
  section: { gap: Spacing.sm },
  sectionLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bio: { fontSize: 15, color: Colors.textPrimary, lineHeight: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: Radius.full,
    backgroundColor: Colors.warmAmber + '22',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: { fontSize: 13, color: Colors.warmAmber, fontWeight: '600' },
  languageText: { fontSize: 15, color: Colors.textPrimary },
  // Book button
  bookBtn: {
    backgroundColor: Colors.safeBlue,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

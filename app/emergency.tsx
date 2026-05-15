import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  BackHandler,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSession } from '@/context/SessionContext';
import { CRISIS_HOTLINES } from '@/constants/hotlines';
import { deleteSensitiveData, getSafetyPlan } from '@/services/storage';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface ActionCardProps {
  icon: IoniconsName;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

export default function EmergencyScreen() {
  const { profile } = useSession();
  const [safetyPlan, setSafetyPlan] = useState<string[]>([]);
  const [showPlan, setShowPlan] = useState(false);
  const [showHotlines, setShowHotlines] = useState(false);

  async function loadSafetyPlan() {
    const plan = await getSafetyPlan();
    setSafetyPlan(plan);
    setShowPlan(true);
  }

  function handleQuickExit() {
    if (Platform.OS === 'android') BackHandler.exitApp();
    else router.replace('/decoy');
  }

  async function handleDeleteData() {
    Alert.alert(
      'Delete sensitive data?',
      'This will permanently delete your journal entries and chat history from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSensitiveData();
            Alert.alert('Done', 'Sensitive data has been deleted.');
          },
        },
      ]
    );
  }

  function callNumber(number: string) {
    const cleaned = number.replace(/[^0-9+]/g, '');
    if (cleaned) Linking.openURL(`tel:${cleaned}`);
  }

  const countryHotlines = CRISIS_HOTLINES.find(
    (c) => c.country.toLowerCase() === (profile?.country ?? '').toLowerCase()
  );
  const displayedHotlines = showHotlines
    ? CRISIS_HOTLINES
    : countryHotlines
    ? [countryHotlines]
    : CRISIS_HOTLINES.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close emergency screen">
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Support</Text>
        <TouchableOpacity
          onPress={handleQuickExit}
          style={styles.quickExitBtn}
          accessibilityLabel="Quick exit"
        >
          <Ionicons name="exit-outline" size={14} color={Colors.white} />
          <Text style={styles.quickExitText}>Quick Exit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.supportText}>
          You are not alone. Help is available right now.
        </Text>

        <View style={styles.grid}>
          <ActionCard icon="call-outline"      label="Call support" description="Connect with a crisis line"   color={Colors.safeBlue}      onPress={() => setShowHotlines(true)} />
          <ActionCard icon="clipboard-outline"  label="Safety plan"  description="Your personal steps"         color={Colors.softGreen}     onPress={loadSafetyPlan} />
          <ActionCard icon="eye-off-outline"    label="Quick hide"   description="Switch to a neutral screen"  color={Colors.mutedLavender} onPress={() => router.replace('/decoy')} />
          <ActionCard icon="trash-outline"      label="Delete data"  description="Wipe sensitive info"         color={Colors.alertRed}      onPress={handleDeleteData} />
        </View>

        {showPlan && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Your safety plan</Text>
            {safetyPlan.length === 0 ? (
              <Text style={styles.emptyPlan}>
                No safety plan saved yet. Go to the Safety Assessment to create one.
              </Text>
            ) : (
              safetyPlan.map((step, i) => (
                <View key={i} style={styles.planStep}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))
            )}
          </Card>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crisis hotlines</Text>
          {displayedHotlines.map((country) => (
            <View key={country.code} style={styles.countryBlock}>
              <Text style={styles.countryName}>{country.country}</Text>
              {country.hotlines.map((h) => (
                <TouchableOpacity
                  key={h.name}
                  style={styles.hotlineRow}
                  onPress={() => callNumber(h.number)}
                  accessibilityLabel={`Call ${h.name} at ${h.number}`}
                >
                  <View style={styles.hotlineInfo}>
                    <Text style={styles.hotlineName}>{h.name}</Text>
                    {h.notes && <Text style={styles.hotlineNotes}>{h.notes}</Text>}
                  </View>
                  <View style={styles.hotlineCallRow}>
                    <Text style={styles.hotlineNumber}>{h.number}</Text>
                    <Ionicons name="call-outline" size={14} color={Colors.safeBlue} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {!showHotlines && (
            <TouchableOpacity onPress={() => setShowHotlines(true)}>
              <Text style={styles.showAll}>Show all countries →</Text>
            </TouchableOpacity>
          )}
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Hide app guide</Text>
          <Text style={styles.hideText}>
            On Android: Settings → Apps → HomeWithin → Disable.{'\n'}
            On iOS: Hold the icon → Remove App → Remove from Home Screen.{'\n\n'}
            You can also set up a disguise name in Profile › Privacy.
          </Text>
        </Card>

        <Button label="One-tap exit" onPress={handleQuickExit} variant="danger" style={styles.exitBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, label, description, color, onPress }: ActionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { borderColor: color + '40' }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`${label} — ${description}`}
    >
      <View style={[styles.actionIconBg, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      <Text style={styles.actionDesc}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  quickExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.alertRed,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  quickExitText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  supportText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', fontStyle: 'italic', lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: Spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  actionDesc: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  section: {
    backgroundColor: Colors.white,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  countryBlock: { marginBottom: Spacing.sm },
  countryName: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  hotlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.softGray, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.xs },
  hotlineInfo: { flex: 1 },
  hotlineName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  hotlineNotes: { fontSize: 11, color: Colors.textMuted },
  hotlineCallRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hotlineNumber: { fontSize: 13, fontWeight: '700', color: Colors.safeBlue },
  showAll: { color: Colors.safeBlue, fontSize: 14, textDecorationLine: 'underline', marginTop: Spacing.xs },
  emptyPlan: { fontSize: 14, color: Colors.textMuted, lineHeight: 20 },
  planStep: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.softGreen, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  stepText: { flex: 1, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  hideText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  exitBtn: { marginTop: Spacing.md },
});

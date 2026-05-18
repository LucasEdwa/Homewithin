import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import type { SafetyStatus } from '@/services/safetyScore';
import type { LocalResource } from '@/types';
import { LOCAL_RESOURCE_TYPE_COLORS, LOCAL_RESOURCE_TYPE_ICONS, LOCAL_RESOURCE_TYPE_LABELS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { IoniconsName } from './safetyData';
import { PLAN_PROMPTS } from './safetyData';

interface ResultsViewProps {
  status: SafetyStatus;
  safetyPlanLines: string[];
  onPlanLineChange: (index: number, value: string) => void;
  onSavePlan: () => Promise<void>;
  savingPlan: boolean;
  nearbyState: string | null;
  nearbyResources: LocalResource[];
  onGoHome: () => void;
}

export default function ResultsView({
  status,
  safetyPlanLines,
  onPlanLineChange,
  onSavePlan,
  savingPlan,
  nearbyState,
  nearbyResources,
  onGoHome,
}: ResultsViewProps) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {status === 'green' && <GreenState />}
          {status === 'yellow' && <YellowState />}
          {status === 'red' && <RedState nearbyState={nearbyState} nearbyResources={nearbyResources} />}

          <Card style={styles.planCard}>
            <Text style={styles.planTitle}>Your safety plan</Text>
            <Text style={styles.planHint}>Saved only on this device. Fill in what feels right for you.</Text>
            {PLAN_PROMPTS.map((prompt, i) => (
              <View key={i} style={styles.planRow}>
                <Text style={styles.planPrompt}>{prompt}</Text>
                <TextInput
                  style={styles.planInput}
                  value={safetyPlanLines[i]}
                  onChangeText={(v) => onPlanLineChange(i, v)}
                  placeholder="Write here…"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={120}
                />
              </View>
            ))}
            <Button
              label={savingPlan ? 'Saving…' : 'Save safety plan'}
              onPress={onSavePlan}
              variant="secondary"
              loading={savingPlan}
              style={{ marginTop: Spacing.md }}
            />
          </Card>

          <Button label="Go to home" onPress={onGoHome} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function GreenState() {
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.softGreen }]}>
      <Ionicons name="checkmark-circle" size={44} color={Colors.softGreen} />
      <Text style={[styles.statusTitle, { color: Colors.softGreen }]}>You seem to be in a safe place.</Text>
      <Text style={styles.statusBody}>
        That's good to hear. HomeWithin is here whenever you want connection, healing, or someone to talk to — on your own timeline.
      </Text>
    </Card>
  );
}

function YellowState() {
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.safetyYellow }]}>
      <Ionicons name="alert-circle" size={44} color={Colors.safetyYellow} />
      <Text style={[styles.statusTitle, { color: '#7A5E00' }]}>Some things are weighing on you.</Text>
      <Text style={styles.statusBody}>
        What you're going through is real and it makes sense that it's heavy. Reaching out to a peer, writing in your journal, or reading a resource can help right now.
      </Text>
      <View style={styles.yellowActions}>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/(tabs)/connect' as any)}>
          <Ionicons name="people-outline" size={18} color={Colors.safeBlue} />
          <Text style={styles.yellowActionText}>Talk to a peer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/ai-companion' as any)}>
          <Ionicons name="sparkles-outline" size={18} color={Colors.mutedLavender} />
          <Text style={styles.yellowActionText}>AI companion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/(tabs)/resources' as any)}>
          <Ionicons name="book-outline" size={18} color={Colors.softGreen} />
          <Text style={styles.yellowActionText}>Resources</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function RedState({
  nearbyState,
  nearbyResources,
}: {
  nearbyState: string | null;
  nearbyResources: LocalResource[];
}) {
  const { refreshLocation } = useSession();
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.alertRed }]}>
      <Ionicons name="heart" size={44} color={Colors.alertRed} />
      <Text style={[styles.statusTitle, { color: Colors.alertRed }]}>You need support right now.</Text>
      <Text style={styles.statusBody}>
        What you're carrying is too much to carry alone. This is not your fault. Please reach out — someone is ready to listen, right now, with no judgment.
      </Text>

      <TouchableOpacity onPress={() => router.push('/emergency' as any)} style={styles.emergencyLink}>
        <Ionicons name="shield-outline" size={15} color={Colors.alertRed} />
        <Text style={styles.emergencyLinkText}>Open emergency screen</Text>
      </TouchableOpacity>

      <View style={styles.localHelpDivider} />
      <View style={styles.localHelpHeader}>
        <Ionicons name="location-outline" size={18} color={Colors.safeBlue} />
        <Text style={styles.localHelpTitle}>Local help centers near you</Text>
      </View>

      {nearbyState && nearbyResources.length > 0 ? (
        <>
          <Text style={styles.localHelpState}>{nearbyState}</Text>
          {nearbyResources.map((r) => (
            <View key={r.id} style={styles.resourceRow}>
              <View style={[styles.resourceBadge, { backgroundColor: LOCAL_RESOURCE_TYPE_COLORS[r.type] + '18' }]}>
                <Ionicons
                  name={LOCAL_RESOURCE_TYPE_ICONS[r.type] as IoniconsName}
                  size={14}
                  color={LOCAL_RESOURCE_TYPE_COLORS[r.type]}
                />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceName}>{r.name}</Text>
                <Text style={styles.resourceType}>{LOCAL_RESOURCE_TYPE_LABELS[r.type]}</Text>
              </View>
              <View style={styles.resourceActions}>
                {r.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${r.phone!.replace(/\s/g, '')}`)}
                    accessibilityLabel={`Call ${r.name}`}
                    style={styles.resourceActionBtn}
                  >
                    <Ionicons name="call-outline" size={18} color={Colors.safeBlue} />
                  </TouchableOpacity>
                )}
                {r.website && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(r.website!)}
                    accessibilityLabel={`Visit ${r.name} website`}
                    style={styles.resourceActionBtn}
                  >
                    <Ionicons name="globe-outline" size={18} color={Colors.safeBlue} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <TouchableOpacity
            testID="see-all-resources-btn"
            style={styles.seeAllBtn}
            onPress={() => router.push('/local-resources' as any)}
          >
            <Text style={styles.seeAllText}>See all resources in {nearbyState}</Text>
            <Ionicons name="arrow-forward-outline" size={14} color={Colors.safeBlue} />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.locationPrompt} onPress={refreshLocation} activeOpacity={0.7}>
          <Ionicons name="location-outline" size={16} color={Colors.safeBlue} />
          <Text style={styles.locationPromptText}>Allow location to show centers near you</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.safeBlue} />
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },

  statusCard: { borderWidth: 2, backgroundColor: Colors.white, alignItems: 'center', gap: Spacing.sm },
  statusTitle: { fontSize: 19, fontWeight: '700', textAlign: 'center' },
  statusBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  yellowActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center', marginTop: Spacing.xs },
  yellowAction: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.softGray, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  yellowActionText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  emergencyLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.xs },
  emergencyLinkText: { fontSize: 14, color: Colors.alertRed, textDecorationLine: 'underline' },

  localHelpDivider: { height: 1, backgroundColor: Colors.alertRed + '30', marginTop: Spacing.md, marginBottom: Spacing.sm },
  localHelpHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  localHelpTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  localHelpDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  locationPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.safeBlue + '12', borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  locationPromptText: { flex: 1, fontSize: 14, color: Colors.safeBlue, fontWeight: '500' },
  localHelpState: { fontSize: 13, color: Colors.safeBlue, fontWeight: '600', marginBottom: 4 },
  resourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  resourceBadge: {
    width: 34, height: 34, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  resourceInfo: { flex: 1 },
  resourceName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  resourceType: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  resourceActions: { flexDirection: 'row', gap: 6 },
  resourceActionBtn: { padding: 4 },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    justifyContent: 'flex-end', paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  seeAllText: { fontSize: 13, color: Colors.safeBlue, fontWeight: '600' },

  planCard: { backgroundColor: Colors.white, gap: Spacing.sm },
  planTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  planHint: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  planRow: { gap: 4 },
  planPrompt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  planInput: {
    backgroundColor: Colors.softGray, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
});

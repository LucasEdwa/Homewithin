import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import type { LocalResource, SafetyStatus } from '@/types';
import { LOCAL_RESOURCE_TYPE_COLORS, LOCAL_RESOURCE_TYPE_ICONS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import type { IoniconsName } from './safetyData';

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
  const { t } = useTranslation();
  const planPromptCount = 4;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.warmWhite }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {status === 'green' && <GreenState />}
          {status === 'yellow' && <YellowState />}
          {status === 'red' && <RedState nearbyState={nearbyState} nearbyResources={nearbyResources} />}

          <Card style={styles.planCard}>
            <Text style={styles.planTitle}>{t('safetyAssessment.planTitle')}</Text>
            <Text style={styles.planHint}>{t('safetyAssessment.planHint')}</Text>
            {Array.from({ length: planPromptCount }, (_, i) => (
              <View key={i} style={styles.planRow}>
                <Text style={styles.planPrompt}>{t(`safetyAssessment.planPrompts.${i}` as any)}</Text>
                <TextInput
                  style={styles.planInput}
                  value={safetyPlanLines[i]}
                  onChangeText={(v) => onPlanLineChange(i, v)}
                  placeholder={t('safetyAssessment.planPlaceholder')}
                  placeholderTextColor={Colors.textMuted}
                  maxLength={120}
                />
              </View>
            ))}
            <Button
              label={savingPlan ? t('safetyAssessment.savingPlan') : t('safetyAssessment.savePlanBtn')}
              onPress={onSavePlan}
              variant="secondary"
              loading={savingPlan}
              style={{ marginTop: Spacing.md }}
            />
          </Card>

          <Button label={t('safetyAssessment.goHome')} onPress={onGoHome} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function GreenState() {
  const { t } = useTranslation();
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.softGreen }]}>
      <Ionicons name="checkmark-circle" size={44} color={Colors.softGreen} />
      <Text style={[styles.statusTitle, { color: Colors.softGreen }]}>{t('safetyAssessment.greenTitle')}</Text>
      <Text style={styles.statusBody}>{t('safetyAssessment.greenBody')}</Text>
    </Card>
  );
}

function YellowState() {
  const { t } = useTranslation();
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.safetyYellow }]}>
      <Ionicons name="alert-circle" size={44} color={Colors.safetyYellow} />
      <Text style={[styles.statusTitle, { color: '#7A5E00' }]}>{t('safetyAssessment.yellowTitle')}</Text>
      <Text style={styles.statusBody}>{t('safetyAssessment.yellowBody')}</Text>
      <View style={styles.yellowActions}>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/(tabs)/connect' as any)}>
          <Ionicons name="people-outline" size={18} color={Colors.safeBlue} />
          <Text style={styles.yellowActionText}>{t('safetyAssessment.yellowTalkToPeer')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/ai-companion' as any)}>
          <Ionicons name="sparkles-outline" size={18} color={Colors.mutedLavender} />
          <Text style={styles.yellowActionText}>{t('safetyAssessment.yellowAI')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.yellowAction} onPress={() => router.push('/(tabs)/resources' as any)}>
          <Ionicons name="book-outline" size={18} color={Colors.softGreen} />
          <Text style={styles.yellowActionText}>{t('safetyAssessment.yellowResources')}</Text>
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
  const { t } = useTranslation();
  const { refreshLocation } = useSession();
  return (
    <Card style={[styles.statusCard, { borderColor: Colors.alertRed }]}>
      <Ionicons name="heart" size={44} color={Colors.alertRed} />
      <Text style={[styles.statusTitle, { color: Colors.alertRed }]}>{t('safetyAssessment.redTitle')}</Text>
      <Text style={styles.statusBody}>{t('safetyAssessment.redBody')}</Text>

      <TouchableOpacity onPress={() => router.push('/emergency' as any)} style={styles.emergencyLink}>
        <Ionicons name="shield-outline" size={15} color={Colors.alertRed} />
        <Text style={styles.emergencyLinkText}>{t('safetyAssessment.openEmergency')}</Text>
      </TouchableOpacity>

      <View style={styles.localHelpDivider} />
      <View style={styles.localHelpHeader}>
        <Ionicons name="location-outline" size={18} color={Colors.safeBlue} />
        <Text style={styles.localHelpTitle}>{t('safetyAssessment.localHelp')}</Text>
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
                <Text style={styles.resourceType}>{t(`localResources.resourceTypes.${r.type}` as any)}</Text>
              </View>
              <View style={styles.resourceActions}>
                {r.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${r.phone!.replace(/\s/g, '')}`)}
                    accessibilityLabel={t('emergency.callName', { name: r.name })}
                    style={styles.resourceActionBtn}
                  >
                    <Ionicons name="call-outline" size={18} color={Colors.safeBlue} />
                  </TouchableOpacity>
                )}
                {r.website && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(r.website!)}
                    accessibilityLabel={t('emergency.visitName', { name: r.name })}
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
            <Text style={styles.seeAllText}>{t('safetyAssessment.seeAll', { state: nearbyState })}</Text>
            <Ionicons name="arrow-forward-outline" size={14} color={Colors.safeBlue} />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.locationPrompt} onPress={refreshLocation} activeOpacity={0.7}>
          <Ionicons name="location-outline" size={16} color={Colors.safeBlue} />
          <Text style={styles.locationPromptText}>{t('safetyAssessment.allowLocation')}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.safeBlue} />
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },

  statusCard: { borderWidth: 2, backgroundColor: Colors.softGray, alignItems: 'center', gap: Spacing.sm },
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

  planCard: { backgroundColor: Colors.softGray, gap: Spacing.sm },
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

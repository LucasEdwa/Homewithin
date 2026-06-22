import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import { deleteSensitiveData, getSafetyPlan } from '@/services/storage';
import { LOCAL_RESOURCE_TYPE_COLORS, LOCAL_RESOURCE_TYPE_ICONS, LOCAL_RESOURCE_TYPE_LABELS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface ActionCardProps {
  icon: IoniconsName;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

export default function EmergencyScreen() {
  const { t } = useTranslation();
  const { nearbyState, nearbyResources } = useSession();
  const [safetyPlan, setSafetyPlan] = useState<string[]>([]);
  const [showPlan, setShowPlan] = useState(false);

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
      t('emergency.deleteDataTitle'),
      t('emergency.deleteDataBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteSensitiveData();
            Alert.alert(t('emergency.done'), t('emergency.deleteDataDone'));
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('emergency.close')}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('emergency.title')}</Text>
        <TouchableOpacity
          onPress={handleQuickExit}
          style={styles.quickExitBtn}
          accessibilityLabel={t('emergency.quickExit')}
        >
          <Ionicons name="exit-outline" size={14} color={Colors.white} />
          <Text style={styles.quickExitText}>{t('emergency.quickExit')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.supportText}>{t('emergency.supportText')}</Text>

        <View style={styles.grid}>
          <ActionCard icon="location-outline"  label={t('emergency.actions.localHelp.label')}  description={t('emergency.actions.localHelp.description')}  color={Colors.safeBlue}      onPress={() => router.push('/local-resources' as any)} />
          <ActionCard icon="clipboard-outline" label={t('emergency.actions.safetyPlan.label')} description={t('emergency.actions.safetyPlan.description')} color={Colors.softGreen}     onPress={loadSafetyPlan} />
          <ActionCard icon="eye-off-outline"   label={t('emergency.actions.quickHide.label')}  description={t('emergency.actions.quickHide.description')}  color={Colors.mutedLavender} onPress={() => router.replace('/decoy')} />
          <ActionCard icon="trash-outline"     label={t('emergency.actions.deleteData.label')} description={t('emergency.actions.deleteData.description')} color={Colors.alertRed}      onPress={handleDeleteData} />
        </View>

        {showPlan && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('emergency.safetyPlanTitle')}</Text>
            {safetyPlan.length === 0 ? (
              <Text style={styles.emptyPlan}>{t('emergency.safetyPlanEmpty')}</Text>
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

        {nearbyResources.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.localHelpHeader}>
              <Ionicons name="location-outline" size={18} color={Colors.safeBlue} />
              <Text style={styles.sectionTitle}>{t('emergency.localHelpTitle', { state: nearbyState })}</Text>
            </View>
            {nearbyResources.map((r) => (
              <View key={r.id} style={styles.resourceRow}>
                <View style={[styles.resourceBadge, { backgroundColor: LOCAL_RESOURCE_TYPE_COLORS[r.type] + '18' }]}>
                  <Ionicons
                    name={LOCAL_RESOURCE_TYPE_ICONS[r.type] as any}
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
              style={styles.seeAllBtn}
              onPress={() => router.push('/local-resources' as any)}
            >
              <Text style={styles.seeAllText}>{t('emergency.seeAll', { state: nearbyState })}</Text>
              <Ionicons name="arrow-forward-outline" size={14} color={Colors.safeBlue} />
            </TouchableOpacity>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('emergency.hideGuideTitle')}</Text>
          <Text style={styles.hideText}>{t('emergency.hideGuideText')}</Text>
        </Card>

        <Button label={t('emergency.oneTapExit')} onPress={handleQuickExit} variant="danger" style={styles.exitBtn} />
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
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  actionDesc: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  section: {
    backgroundColor: Colors.softGray,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
  // Local help centers
  localHelpHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  resourceBadge: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resourceInfo: { flex: 1 },
  resourceName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  resourceType: { fontSize: 12, color: Colors.textMuted },
  resourceActions: { flexDirection: 'row', gap: 6 },
  resourceActionBtn: { padding: 4 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  seeAllText: { fontSize: 14, color: Colors.safeBlue, fontWeight: '500' },
});

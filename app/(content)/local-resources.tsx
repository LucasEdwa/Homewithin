import { Colors } from '@/constants/Colors';
import { RESOURCE_LOCATIONS } from '@/data/localResources';
import { Radius, Spacing } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import {
  getResources,
  requestLocationPermission,
} from '@/services/content/localResources';
import type { LocalResource, LocalResourceType } from '@/types';
import {
  LOCAL_RESOURCE_TYPES,
  LOCAL_RESOURCE_TYPE_COLORS,
  LOCAL_RESOURCE_TYPE_ICONS,
} from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function LocalResourcesScreen() {
  const { t } = useTranslation();
  const { nearbyState, profile } = useSession();
  const [selectedType, setSelectedType] = useState<LocalResourceType | undefined>(undefined);
  const [selectedState, setSelectedState] = useState<string>(nearbyState ?? profile?.country ?? 'Sweden');
  const [locationGranted, setLocationGranted] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  useEffect(() => {
    if (nearbyState) setSelectedState(nearbyState);
  }, [nearbyState]);

  const resources = getResources(selectedState, selectedType);

  const handleRequestLocation = useCallback(async () => {
    const result = await requestLocationPermission();
    if (result.granted) {
      setLocationGranted(true);
      if (result.state) {
        setSelectedState(result.state);
        Alert.alert(t('localResources.locationDetected'), t('localResources.locationDetectedBody', { state: result.state }));
      } else {
        Alert.alert(t('localResources.locationEnabled'), t('localResources.locationEnabledBody'));
      }
    } else {
      Alert.alert(
        t('localResources.locationDenied'),
        t('localResources.locationDeniedBody'),
        [{ text: t('common.ok') }]
      );
    }
  }, [t]);

  const openLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert(t('localResources.couldNotOpenLink'), t('localResources.checkConnection'))
    );
  }, [t]);

  const callPhone = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() =>
      Alert.alert(t('localResources.couldNotCall'), phone)
    );
  }, [t]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('localResources.title')}</Text>
        <TouchableOpacity
          testID="location-btn"
          onPress={handleRequestLocation}
          style={styles.locationBtn}
          accessibilityLabel={t('localResources.useMyLocation')}
        >
          <Ionicons
            name={locationGranted ? 'location' : 'location-outline'}
            size={22}
            color={locationGranted ? Colors.safeBlue : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        testID="state-picker"
        style={styles.stateRow}
        onPress={() => setShowStatePicker((v) => !v)}
        activeOpacity={0.7}
      >
        <Ionicons name="map-outline" size={16} color={Colors.safeBlue} />
        <Text style={styles.stateLabel}>{selectedState}</Text>
        <Ionicons
          name={showStatePicker ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </TouchableOpacity>

      {showStatePicker && (
        <View style={styles.stateList}>
          {RESOURCE_LOCATIONS.map((c) => (
            <TouchableOpacity
              key={c}
              testID={`state-${c}`}
              style={[styles.stateOption, c === selectedState && styles.stateOptionActive]}
              onPress={() => {
                setSelectedState(c);
                setShowStatePicker(false);
              }}
            >
              <Text
                style={[
                  styles.stateOptionText,
                  c === selectedState && styles.stateOptionTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          testID="filter-all"
          activeOpacity={0.7}
          style={[styles.chip, !selectedType && styles.chipActive]}
          onPress={() => setSelectedType(undefined)}
        >
          <Text style={[styles.chipText, !selectedType && styles.chipTextActive]}>{t('localResources.filterAll')}</Text>
        </TouchableOpacity>
        {LOCAL_RESOURCE_TYPES.map((type) => {
          const active = selectedType === type;
          const color = LOCAL_RESOURCE_TYPE_COLORS[type];
          return (
            <TouchableOpacity
              key={type}
              testID={`filter-${type}`}
              activeOpacity={0.7}
              style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
              onPress={() => setSelectedType(active ? undefined : type)}
            >
              <Ionicons
                name={LOCAL_RESOURCE_TYPE_ICONS[type] as IoniconsName}
                size={13}
                color={active ? Colors.white : color}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t(`localResources.resourceTypes.${type}` as any)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {resources.length === 0 ? (
        <View style={styles.empty} testID="empty-state">
          <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>{t('localResources.emptyTitle')}</Text>
          <Text style={styles.emptyHint}>{t('localResources.emptyHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              onOpenLink={openLink}
              onCall={callPhone}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

interface ResourceCardProps {
  resource: LocalResource;
  onOpenLink: (url: string) => void;
  onCall: (phone: string) => void;
}

function ResourceCard({ resource, onOpenLink, onCall }: ResourceCardProps) {
  const { t } = useTranslation();
  const color = LOCAL_RESOURCE_TYPE_COLORS[resource.type];
  const icon = LOCAL_RESOURCE_TYPE_ICONS[resource.type] as IoniconsName;

  return (
    <View style={styles.card} testID={`resource-${resource.id}`}>
      <View style={styles.cardHeader}>
        <View style={styles.typeIcon}>
          <Ionicons name={icon} size={20} color={Colors.textMuted} />
        </View>
        <View style={styles.cardMeta}>
          <View style={[styles.typeBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.typeBadgeText, { color }]}>
              {t(`localResources.resourceTypes.${resource.type}` as any)}
            </Text>
          </View>
          {resource.city && (
            <Text style={styles.cityText}>{resource.city}</Text>
          )}
        </View>
      </View>

      <Text style={styles.cardName}>{resource.name}</Text>
      <Text style={styles.cardDescription}>{resource.description}</Text>

      <View style={styles.cardActions}>
        {resource.website && (
          <TouchableOpacity
            testID={`website-${resource.id}`}
            style={[styles.actionBtn, { borderColor: color }]}
            onPress={() => onOpenLink(resource.website!)}
            accessibilityLabel={t('emergency.visitName', { name: resource.name })}
          >
            <Ionicons name="globe-outline" size={14} color={color} />
            <Text style={[styles.actionBtnText, { color }]}>{t('localResources.websiteBtn')}</Text>
          </TouchableOpacity>
        )}
        {resource.phone && (
          <TouchableOpacity
            testID={`phone-${resource.id}`}
            style={[styles.actionBtn, { borderColor: Colors.softGreen }]}
            onPress={() => onCall(resource.phone!)}
            accessibilityLabel={t('emergency.callName', { name: resource.name })}
          >
            <Ionicons name="call-outline" size={14} color={Colors.softGreen} />
            <Text style={[styles.actionBtnText, { color: Colors.softGreen }]}>
              {resource.phone}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  locationBtn: { padding: 4 },

  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stateLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  stateList: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  stateOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stateOptionActive: { backgroundColor: Colors.safeBlue + '10' },
  stateOptionText: { fontSize: 15, color: Colors.textSecondary },
  stateOptionTextActive: { color: Colors.safeBlue, fontWeight: '600' },

  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginVertical: Spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Colors.safeBlue,
    borderColor: Colors.safeBlue,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.white, fontWeight: '600' },

  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },

  card: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  typeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardMeta: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  cityText: { fontSize: 12, color: Colors.textMuted },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
  cardDescription: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: { fontSize: 17, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});

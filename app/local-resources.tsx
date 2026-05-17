import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { useSession } from '@/context/SessionContext';
import {
  getResources,
  requestLocationPermission,
} from '@/services/localResources';
import { SUPPORTED_COUNTRIES } from '@/constants/localResources';
import {
  LOCAL_RESOURCE_TYPES,
  LOCAL_RESOURCE_TYPE_LABELS,
  LOCAL_RESOURCE_TYPE_ICONS,
  LOCAL_RESOURCE_TYPE_COLORS,
} from '@/types';
import type { LocalResource, LocalResourceType } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function LocalResourcesScreen() {
  const { profile } = useSession();
  const [selectedType, setSelectedType] = useState<LocalResourceType | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    profile?.country ?? 'United States'
  );
  const [locationGranted, setLocationGranted] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const resources = getResources(selectedCountry, selectedType);

  const handleRequestLocation = useCallback(async () => {
    const result = await requestLocationPermission();
    if (result.granted) {
      setLocationGranted(true);
      Alert.alert('Location enabled', 'Showing resources closest to you.');
    } else {
      Alert.alert(
        'Location not available',
        'Location access was denied. You can still browse by country.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const openLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open link', 'Please check your internet connection.')
    );
  }, []);

  const callPhone = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() =>
      Alert.alert('Could not make call', phone)
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Local Resources</Text>
        <TouchableOpacity
          testID="location-btn"
          onPress={handleRequestLocation}
          style={styles.locationBtn}
          accessibilityLabel="Use my location"
        >
          <Ionicons
            name={locationGranted ? 'location' : 'location-outline'}
            size={22}
            color={locationGranted ? Colors.safeBlue : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Country picker */}
      <TouchableOpacity
        testID="country-picker"
        style={styles.countryRow}
        onPress={() => setShowCountryPicker((v) => !v)}
        activeOpacity={0.7}
      >
        <Ionicons name="globe-outline" size={16} color={Colors.safeBlue} />
        <Text style={styles.countryLabel}>{selectedCountry}</Text>
        <Ionicons
          name={showCountryPicker ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </TouchableOpacity>

      {showCountryPicker && (
        <View style={styles.countryList}>
          {SUPPORTED_COUNTRIES.map((c) => (
            <TouchableOpacity
              key={c}
              testID={`country-${c}`}
              style={[styles.countryOption, c === selectedCountry && styles.countryOptionActive]}
              onPress={() => {
                setSelectedCountry(c);
                setShowCountryPicker(false);
              }}
            >
              <Text
                style={[
                  styles.countryOptionText,
                  c === selectedCountry && styles.countryOptionTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Type filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          testID="filter-all"
          style={[styles.chip, !selectedType && styles.chipActive]}
          onPress={() => setSelectedType(undefined)}
        >
          <Text style={[styles.chipText, !selectedType && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {LOCAL_RESOURCE_TYPES.map((type) => {
          const active = selectedType === type;
          const color = LOCAL_RESOURCE_TYPE_COLORS[type];
          return (
            <TouchableOpacity
              key={type}
              testID={`filter-${type}`}
              style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
              onPress={() => setSelectedType(active ? undefined : type)}
            >
              <Ionicons
                name={LOCAL_RESOURCE_TYPE_ICONS[type] as IoniconsName}
                size={13}
                color={active ? Colors.white : color}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {LOCAL_RESOURCE_TYPE_LABELS[type]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Resource list */}
      {resources.length === 0 ? (
        <View style={styles.empty} testID="empty-state">
          <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No resources found for this filter.</Text>
          <Text style={styles.emptyHint}>Try a different country or type.</Text>
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
  const color = LOCAL_RESOURCE_TYPE_COLORS[resource.type];
  const icon = LOCAL_RESOURCE_TYPE_ICONS[resource.type] as IoniconsName;

  return (
    <View style={styles.card} testID={`resource-${resource.id}`}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.cardMeta}>
          <View style={[styles.typeBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.typeBadgeText, { color }]}>
              {LOCAL_RESOURCE_TYPE_LABELS[resource.type]}
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
            accessibilityLabel={`Visit ${resource.name} website`}
          >
            <Ionicons name="globe-outline" size={14} color={color} />
            <Text style={[styles.actionBtnText, { color }]}>Website</Text>
          </TouchableOpacity>
        )}
        {resource.phone && (
          <TouchableOpacity
            testID={`phone-${resource.id}`}
            style={[styles.actionBtn, { borderColor: Colors.softGreen }]}
            onPress={() => onCall(resource.phone!)}
            accessibilityLabel={`Call ${resource.name}`}
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

  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countryLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  countryList: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  countryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryOptionActive: { backgroundColor: Colors.safeBlue + '10' },
  countryOptionText: { fontSize: 15, color: Colors.textSecondary },
  countryOptionTextActive: { color: Colors.safeBlue, fontWeight: '600' },

  filtersScroll: { flexGrow: 0 },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.safeBlue,
    borderColor: Colors.safeBlue,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.white },

  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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

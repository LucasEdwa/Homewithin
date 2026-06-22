import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { RESOURCE_LOCATIONS } from '@/data/localResources';
import { useSession } from '@/context/SessionContext';
import { getMeetups, getWorkshops } from '@/services/content/localResources';
import type { LocalMeetup, Workshop, WorkshopFormat } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Linking,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Tab = 'workshops' | 'meetups';
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FORMAT_ICONS: Record<WorkshopFormat, IoniconsName> = {
  online: 'wifi-outline',
  in_person: 'location-outline',
  hybrid: 'git-network-outline',
};
const FORMAT_COLORS: Record<WorkshopFormat, string> = {
  online: Colors.safeBlue,
  in_person: Colors.softGreen,
  hybrid: '#B8A8E3',
};

export default function EventsScreen() {
  const { t } = useTranslation();
  const { nearbyState, profile } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('workshops');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [manualLocationOverride, setManualLocationOverride] = useState(false);

  const nearbyLocation = nearbyState ?? profile?.country ?? 'your area';
  const [selectedLocation, setSelectedLocation] = useState(nearbyLocation);

  useEffect(() => {
    if (!manualLocationOverride) {
      setSelectedLocation(nearbyLocation);
    }
  }, [nearbyLocation, manualLocationOverride]);

  const workshops = getWorkshops();
  const meetups = getMeetups(selectedLocation);

  const openLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert(t('events.couldNotOpenLink'), t('events.checkConnection'))
    );
  }, [t]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('events.title')}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          testID="tab-workshops"
          style={[styles.tab, activeTab === 'workshops' && styles.tabActive]}
          onPress={() => setActiveTab('workshops')}
        >
          <Ionicons
            name="layers-outline"
            size={16}
            color={activeTab === 'workshops' ? Colors.safeBlue : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'workshops' && styles.tabTextActive]}>
            {t('events.onlineCircles')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tab-meetups"
          style={[styles.tab, activeTab === 'meetups' && styles.tabActive]}
          onPress={() => setActiveTab('meetups')}
        >
          <Ionicons
            name="map-outline"
            size={16}
            color={activeTab === 'meetups' ? Colors.safeBlue : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'meetups' && styles.tabTextActive]}>
            {t('events.localMeetups')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'meetups' && (
        <>
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => setShowLocationPicker((value) => !value)}
            accessibilityLabel={t('events.usingLocation')}
            testID="events-location-picker"
          >
            <Ionicons name="location-outline" size={16} color={Colors.safeBlue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>{t('events.usingLocation')}</Text>
              <Text style={styles.locationValue}>{selectedLocation}</Text>
            </View>
            <Ionicons
              name={showLocationPicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.textMuted}
            />
          </TouchableOpacity>

          {showLocationPicker && (
            <View style={styles.locationList}>
              {RESOURCE_LOCATIONS.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.locationOption,
                    location === selectedLocation && styles.locationOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedLocation(location);
                    setManualLocationOverride(true);
                    setShowLocationPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.locationOptionText,
                      location === selectedLocation && styles.locationOptionTextActive,
                    ]}
                  >
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}

              {manualLocationOverride && (
                <TouchableOpacity
                  style={styles.locationResetBtn}
                  onPress={() => {
                    setManualLocationOverride(false);
                    setSelectedLocation(nearbyLocation);
                    setShowLocationPicker(false);
                  }}
                >
                  <Ionicons name="navigate-outline" size={13} color={Colors.safeBlue} />
                  <Text style={styles.locationResetBtnText}>
                    {t('events.useDetected', { location: nearbyLocation })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}

      {activeTab === 'workshops' ? (
        <WorkshopsList workshops={workshops} onOpenLink={openLink} />
      ) : (
        <MeetupsList meetups={meetups} country={selectedLocation} onOpenLink={openLink} />
      )}
    </SafeAreaView>
  );
}

interface WorkshopsListProps {
  workshops: Workshop[];
  onOpenLink: (url: string) => void;
}

function WorkshopsList({ workshops, onOpenLink }: WorkshopsListProps) {
  const { t } = useTranslation();
  if (workshops.length === 0) {
    return (
      <View style={styles.empty} testID="workshops-empty">
        <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>{t('events.noCircles')}</Text>
        <Text style={styles.emptyHint}>{t('events.checkBackSoon')}</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={[{ title: t('events.upcomingRecurring'), data: workshops }]}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <WorkshopCard workshop={item} onOpenLink={onOpenLink} />
      )}
    />
  );
}

interface WorkshopCardProps {
  workshop: Workshop;
  onOpenLink: (url: string) => void;
}

function WorkshopCard({ workshop, onOpenLink }: WorkshopCardProps) {
  const { t } = useTranslation();
  const color = FORMAT_COLORS[workshop.format];

  return (
    <View style={styles.card} testID={`workshop-${workshop.id}`}>
      <View style={styles.cardTopRow}>
        <View style={[styles.formatBadge, { backgroundColor: color + '18' }]}>
          <Ionicons name={FORMAT_ICONS[workshop.format]} size={12} color={color} />
          <Text style={[styles.formatText, { color }]}>{t(`events.formatLabels.${workshop.format}` as any)}</Text>
        </View>
        {workshop.free && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>{t('events.free')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle}>{workshop.title}</Text>
      <Text style={styles.cardDesc}>{workshop.description}</Text>

      <View style={styles.metaRow}>
        <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.metaText}>{workshop.host}</Text>
      </View>

      {workshop.recurring && (
        <View style={styles.metaRow}>
          <Ionicons name="repeat-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{workshop.recurring}</Text>
        </View>
      )}

      {workshop.link && (
        <TouchableOpacity
          testID={`join-${workshop.id}`}
          style={styles.joinBtnLocked}
          onPress={() =>
            Alert.alert(
              t('events.comingSoon'),
              t('events.comingSoonBody'),
              [{ text: t('events.gotIt') }]
            )
          }
          accessibilityLabel={workshop.title}
        >
          <Ionicons name="lock-closed" size={16} color={Colors.safetyYellow} />
          <Text style={styles.joinBtnLockedText}>{t('events.joinCircle')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface MeetupsListProps {
  meetups: LocalMeetup[];
  country: string;
  onOpenLink: (url: string) => void;
}

function MeetupsList({ meetups, country, onOpenLink }: MeetupsListProps) {
  const { t } = useTranslation();
  if (meetups.length === 0) {
    return (
      <View style={styles.empty} testID="meetups-empty">
        <Ionicons name="map-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>{t('events.noMeetups')}</Text>
        <Text style={styles.emptyHint}>{t('events.checkBackLater')}</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={[{ title: t('events.nearLocation', { location: country }), data: meetups }]}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <MeetupCard meetup={item} onOpenLink={onOpenLink} />
      )}
    />
  );
}

interface MeetupCardProps {
  meetup: LocalMeetup;
  onOpenLink: (url: string) => void;
}

function MeetupCard({ meetup, onOpenLink }: MeetupCardProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.card} testID={`meetup-${meetup.id}`}>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={13} color={Colors.softGreen} />
        <Text style={[styles.metaText, { color: Colors.softGreen, fontWeight: '600' }]}>
          {meetup.city}, {meetup.state}
        </Text>
      </View>

      <Text style={styles.cardTitle}>{meetup.title}</Text>
      <Text style={styles.cardDesc}>{meetup.description}</Text>

      {meetup.recurring && (
        <View style={styles.metaRow}>
          <Ionicons name="repeat-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{meetup.recurring}</Text>
        </View>
      )}

      {meetup.link && (
        <TouchableOpacity
          testID={`rsvp-${meetup.id}`}
          style={[styles.joinBtn, { backgroundColor: Colors.softGreen }]}
          onPress={() => onOpenLink(meetup.link!)}
          accessibilityLabel={meetup.title}
        >
          <Ionicons name="calendar-outline" size={16} color={Colors.white} />
          <Text style={styles.joinBtnText}>{t('events.rsvpView')}</Text>
        </TouchableOpacity>
      )}
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

  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  locationRow: {
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
  locationLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  locationValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  locationList: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  locationOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationOptionActive: { backgroundColor: Colors.safeBlue + '10' },
  locationOptionText: { fontSize: 15, color: Colors.textSecondary },
  locationOptionTextActive: { color: Colors.safeBlue, fontWeight: '600' },
  locationResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  locationResetBtnText: { fontSize: 13, color: Colors.safeBlue, fontWeight: '600' },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.safeBlue },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },

  card: {
    backgroundColor: Colors.softGray,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  formatText: { fontSize: 11, fontWeight: '600' },
  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.softGreen + '20',
  },
  freeText: { fontSize: 11, fontWeight: '600', color: Colors.softGreen },

  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
  cardDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: Colors.textMuted },

  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.safeBlue,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  joinBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  joinBtnLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.safetyYellow + '18',
    borderWidth: 1,
    borderColor: Colors.safetyYellow + '55',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  joinBtnLockedText: { fontSize: 14, fontWeight: '700', color: Colors.safetyYellow },

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

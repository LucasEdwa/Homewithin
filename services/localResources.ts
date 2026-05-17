import type { LocalResource, LocalResourceType, Workshop, LocalMeetup } from '@/types';
import {
  LOCAL_RESOURCES,
  WORKSHOPS,
  LOCAL_MEETUPS,
} from '@/constants/localResources';

// ── Location (optional) ───────────────────────────────────────────────────────
// expo-location is not in the base install. To enable GPS-based country
// detection, run: npx expo install expo-location
// and uncomment the implementation below.

export interface LocationResult {
  granted: boolean;
  lat?: number;
  lng?: number;
}

export async function requestLocationPermission(): Promise<LocationResult> {
  try {
    // Dynamic import so the app still works without expo-location installed.
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { granted: false };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { granted: true, lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return { granted: false };
  }
}

// ── Resource helpers ──────────────────────────────────────────────────────────

export function getResourcesByCountry(country: string): LocalResource[] {
  return LOCAL_RESOURCES.filter(
    (r) => r.country.toLowerCase() === country.toLowerCase()
  );
}

export function getResourcesByType(type: LocalResourceType): LocalResource[] {
  return LOCAL_RESOURCES.filter((r) => r.type === type);
}

export function filterResources(
  country: string,
  type?: LocalResourceType
): LocalResource[] {
  const byCountry = getResourcesByCountry(country);
  if (!type) return byCountry;
  return byCountry.filter((r) => r.type === type);
}

// Returns all resources when country is unrecognised (fallback to full list).
export function getResources(country?: string, type?: LocalResourceType): LocalResource[] {
  if (!country) return type ? getResourcesByType(type) : LOCAL_RESOURCES;
  const results = filterResources(country, type);
  if (results.length === 0 && country) {
    // Country not in dataset — fall back to type-filtered global list
    return type ? getResourcesByType(type) : LOCAL_RESOURCES;
  }
  return results;
}

// ── Workshop helpers ──────────────────────────────────────────────────────────

export function getWorkshops(category?: string): Workshop[] {
  if (!category) return WORKSHOPS;
  return WORKSHOPS.filter((w) => w.category === category);
}

// ── Meetup helpers ────────────────────────────────────────────────────────────

export function getMeetupsByCountry(country: string): LocalMeetup[] {
  return LOCAL_MEETUPS.filter(
    (m) => m.country.toLowerCase() === country.toLowerCase()
  );
}

export function getMeetups(country?: string): LocalMeetup[] {
  if (!country) return LOCAL_MEETUPS;
  const results = getMeetupsByCountry(country);
  return results.length > 0 ? results : LOCAL_MEETUPS;
}

// ── Distance (haversine, km) ──────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortByDistance<T extends { lat?: number; lng?: number }>(
  items: T[],
  userLat: number,
  userLng: number
): T[] {
  return [...items].sort((a, b) => {
    const dA =
      a.lat != null && a.lng != null
        ? haversineKm(userLat, userLng, a.lat, a.lng)
        : Infinity;
    const dB =
      b.lat != null && b.lng != null
        ? haversineKm(userLat, userLng, b.lat, b.lng)
        : Infinity;
    return dA - dB;
  });
}

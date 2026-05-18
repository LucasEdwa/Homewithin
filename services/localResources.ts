import {
    LOCAL_MEETUPS,
    LOCAL_RESOURCES,
    SWEDISH_COUNTIES,
    WORKSHOPS,
} from "@/constants/localResources";
import type {
    LocalMeetup,
    LocalResource,
    LocalResourceType,
    Workshop,
} from "@/types";

// ── Location ──────────────────────────────────────────────────────────────────

export interface LocationResult {
  granted: boolean;
  county?: string; // matched Swedish county, if detectable
}

export async function requestLocationPermission(): Promise<LocationResult> {
  try {
    const Location = await import("expo-location");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return { granted: false };

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Reverse-geocode to get the region name (= Swedish county)
    const [address] = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });

    const region = address?.region ?? "";
    // Match against the known Swedish counties list (case-insensitive prefix match)
    const matched = (SWEDISH_COUNTIES as readonly string[]).find(
      (c) =>
        region.toLowerCase().startsWith(c.toLowerCase()) ||
        c.toLowerCase().startsWith(region.toLowerCase()),
    );

    return { granted: true, county: matched };
  } catch {
    return { granted: false };
  }
}

// ── Resource helpers ──────────────────────────────────────────────────────────

export function getResourcesByCountry(country: string): LocalResource[] {
  return LOCAL_RESOURCES.filter(
    (r) => r.country.toLowerCase() === country.toLowerCase(),
  );
}

export function getResourcesByType(type: LocalResourceType): LocalResource[] {
  return LOCAL_RESOURCES.filter((r) => r.type === type);
}

export function filterResources(
  country: string,
  type?: LocalResourceType,
): LocalResource[] {
  const byCountry = getResourcesByCountry(country);
  if (!type) return byCountry;
  return byCountry.filter((r) => r.type === type);
}

// Returns county resources + national (country: 'Sweden') resources for any county selection.
export function getResources(
  country?: string,
  type?: LocalResourceType,
): LocalResource[] {
  if (!country) return type ? getResourcesByType(type) : LOCAL_RESOURCES;

  const countyResults = filterResources(country, type);

  // Include national resources alongside any county-specific ones
  const nationalResults =
    country.toLowerCase() !== "sweden"
      ? LOCAL_RESOURCES.filter(
          (r) =>
            r.country.toLowerCase() === "sweden" &&
            (!type || r.type === type),
        )
      : [];

  const combined = [...countyResults, ...nationalResults];
  if (combined.length === 0) {
    return type ? getResourcesByType(type) : LOCAL_RESOURCES;
  }
  return combined;
}

// ── Workshop helpers ──────────────────────────────────────────────────────────

export function getWorkshops(category?: string): Workshop[] {
  if (!category) return WORKSHOPS;
  return WORKSHOPS.filter((w) => w.category === category);
}

// ── Meetup helpers ────────────────────────────────────────────────────────────

export function getMeetupsByCountry(country: string): LocalMeetup[] {
  return LOCAL_MEETUPS.filter(
    (m) => m.country.toLowerCase() === country.toLowerCase(),
  );
}

export function getMeetups(country?: string): LocalMeetup[] {
  if (!country) return LOCAL_MEETUPS;

  const countyResults = getMeetupsByCountry(country);
  const nationalResults =
    country.toLowerCase() !== "sweden"
      ? LOCAL_MEETUPS.filter((m) => m.country.toLowerCase() === "sweden")
      : [];

  const combined = [...countyResults, ...nationalResults];
  return combined.length > 0 ? combined : LOCAL_MEETUPS;
}

// ── Distance (haversine, km) ──────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
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
  userLng: number,
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

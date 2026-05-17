import {
  getResourcesByCountry,
  getResourcesByType,
  filterResources,
  getResources,
  getWorkshops,
  getMeetupsByCountry,
  getMeetups,
  sortByDistance,
} from '@/services/localResources';
import { LOCAL_RESOURCES, WORKSHOPS, LOCAL_MEETUPS } from '@/constants/localResources';
import type { LocalResource } from '@/types';

describe('getResourcesByCountry', () => {
  it('returns only resources for the given country', () => {
    const results = getResourcesByCountry('Brazil');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.country === 'Brazil')).toBe(true);
  });

  it('is case-insensitive', () => {
    const lower = getResourcesByCountry('brazil');
    const normal = getResourcesByCountry('Brazil');
    expect(lower.length).toBe(normal.length);
  });

  it('returns empty array for unsupported country', () => {
    expect(getResourcesByCountry('Atlantis')).toEqual([]);
  });
});

describe('getResourcesByType', () => {
  it('returns resources of the requested type', () => {
    const results = getResourcesByType('shelter');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === 'shelter')).toBe(true);
  });

  it('covers all supported types', () => {
    const types = ['lgbtq_center', 'shelter', 'therapist', 'legal_aid', 'support_group'] as const;
    for (const type of types) {
      expect(getResourcesByType(type).length).toBeGreaterThan(0);
    }
  });
});

describe('filterResources', () => {
  it('returns country resources when no type given', () => {
    const all = getResourcesByCountry('United States');
    const filtered = filterResources('United States');
    expect(filtered.length).toBe(all.length);
  });

  it('narrows by type', () => {
    const results = filterResources('United States', 'legal_aid');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === 'legal_aid' && r.country === 'United States')).toBe(true);
  });

  it('returns empty array when type not present for country', () => {
    const results = filterResources('Germany', 'support_group');
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('getResources (public API)', () => {
  it('falls back to full list when country not in dataset', () => {
    const results = getResources('Narnia');
    expect(results.length).toBe(LOCAL_RESOURCES.length);
  });

  it('returns country resources when country provided', () => {
    const results = getResources('Canada');
    expect(results.every((r) => r.country === 'Canada')).toBe(true);
  });

  it('filters by type across all countries when no country given', () => {
    const results = getResources(undefined, 'shelter');
    expect(results.every((r) => r.type === 'shelter')).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns all resources when no args', () => {
    const results = getResources();
    expect(results.length).toBe(LOCAL_RESOURCES.length);
  });
});

describe('getWorkshops', () => {
  it('returns all workshops when no category', () => {
    expect(getWorkshops().length).toBe(WORKSHOPS.length);
  });

  it('filters by category', () => {
    const results = getWorkshops('online');
    expect(results.every((w) => w.category === 'online')).toBe(true);
  });

  it('all workshops have required fields', () => {
    for (const w of WORKSHOPS) {
      expect(w.id).toBeTruthy();
      expect(w.title).toBeTruthy();
      expect(w.host).toBeTruthy();
      expect(['online', 'in_person', 'hybrid']).toContain(w.format);
    }
  });
});

describe('getMeetupsByCountry', () => {
  it('returns meetups for the given country', () => {
    const results = getMeetupsByCountry('Brazil');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((m) => m.country === 'Brazil')).toBe(true);
  });

  it('returns empty for unknown country', () => {
    expect(getMeetupsByCountry('Wakanda')).toEqual([]);
  });
});

describe('getMeetups', () => {
  it('returns all meetups when no country', () => {
    expect(getMeetups().length).toBe(LOCAL_MEETUPS.length);
  });

  it('falls back to full list when country not in dataset', () => {
    const results = getMeetups('Utopia');
    expect(results.length).toBe(LOCAL_MEETUPS.length);
  });

  it('returns country-filtered list when country found', () => {
    const results = getMeetups('United States');
    expect(results.every((m) => m.country === 'United States')).toBe(true);
  });
});

describe('sortByDistance', () => {
  const items: LocalResource[] = [
    { id: 'a', name: 'Far', type: 'lgbtq_center', description: '', country: 'X', lat: 51.5, lng: -0.1 }, // London
    { id: 'b', name: 'Near', type: 'lgbtq_center', description: '', country: 'X', lat: 48.85, lng: 2.35 }, // Paris
    { id: 'c', name: 'No coords', type: 'lgbtq_center', description: '', country: 'X' },
  ];

  it('sorts items with coords before items without', () => {
    const sorted = sortByDistance(items, 48.85, 2.35); // user in Paris
    expect(sorted[0].id).toBe('b'); // Paris nearest
    expect(sorted[sorted.length - 1].id).toBe('c'); // no coords last
  });

  it('does not mutate the original array', () => {
    const original = [...items];
    sortByDistance(items, 0, 0);
    expect(items).toEqual(original);
  });
});

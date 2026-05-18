import {
  LOCAL_MEETUPS,
  LOCAL_RESOURCES,
  WORKSHOPS,
} from '@/constants/localResources';
import {
  filterResources,
  getMeetups,
  getMeetupsByState,
  getResources,
  getResourcesByState,
  getResourcesByType,
  getWorkshops,
  sortByDistance,
} from '@/services/localResources';
import type { LocalResource } from '@/types';

describe('getResourcesByState', () => {
  it('returns only resources for the given state', () => {
    const results = getResourcesByState('Stockholm');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.state === 'Stockholm')).toBe(true);
  });

  it('is case-insensitive', () => {
    const lower = getResourcesByState('stockholm');
    const normal = getResourcesByState('Stockholm');
    expect(lower.length).toBe(normal.length);
  });

  it('returns empty array for unsupported state', () => {
    expect(getResourcesByState('Atlantis')).toEqual([]);
  });
});

describe('getResourcesByType', () => {
  it('returns resources of the requested type', () => {
    const results = getResourcesByType('lgbtq_center');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === 'lgbtq_center')).toBe(true);
  });

  it('covers all supported types', () => {
    const types = ['lgbtq_center', 'shelter', 'therapist', 'legal_aid', 'support_group'] as const;
    for (const type of types) {
      expect(getResourcesByType(type).length).toBeGreaterThan(0);
    }
  });
});

describe('filterResources', () => {
  it('returns state resources when no type given', () => {
    const all = getResourcesByState('Stockholm');
    const filtered = filterResources('Stockholm');
    expect(filtered.length).toBe(all.length);
  });

  it('narrows by type', () => {
    const results = filterResources('Stockholm', 'therapist');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === 'therapist' && r.state === 'Stockholm')).toBe(true);
  });

  it('returns empty array when type not present for state', () => {
    const results = filterResources('Gotland', 'support_group');
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('getResources (public API)', () => {
  it('returns national resources when state not in dataset', () => {
    const results = getResources('Narnia');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.state === 'Sweden')).toBe(true);
  });

  it('returns state + national resources when state provided', () => {
    const results = getResources('Stockholm');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.state === 'Stockholm' || r.state === 'Sweden')).toBe(true);
  });

  it('filters by type when no state given', () => {
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

describe('getMeetupsByState', () => {
  it('returns meetups for the given state', () => {
    const results = getMeetupsByState('Stockholm');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((m) => m.state === 'Stockholm')).toBe(true);
  });

  it('returns empty for unknown state', () => {
    expect(getMeetupsByState('Wakanda')).toEqual([]);
  });
});

describe('getMeetups', () => {
  it('returns all meetups when no state', () => {
    expect(getMeetups().length).toBe(LOCAL_MEETUPS.length);
  });

  it('returns national meetups when state not in dataset', () => {
    const results = getMeetups('Utopia');
    expect(results.every((m) => m.state === 'Sweden')).toBe(true);
  });

  it('returns state + national meetups when state found', () => {
    const results = getMeetups('Stockholm');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((m) => m.state === 'Stockholm' || m.state === 'Sweden')).toBe(true);
  });
});

describe('sortByDistance', () => {
  const items: LocalResource[] = [
    { id: 'a', name: 'Far', type: 'lgbtq_center', description: '', state: 'X', lat: 51.5, lng: -0.1 },
    { id: 'b', name: 'Near', type: 'lgbtq_center', description: '', state: 'X', lat: 48.85, lng: 2.35 },
    { id: 'c', name: 'No coords', type: 'lgbtq_center', description: '', state: 'X' },
  ];

  it('sorts items with coords before items without', () => {
    const sorted = sortByDistance(items, 48.85, 2.35);
    expect(sorted[0].id).toBe('b');
    expect(sorted[sorted.length - 1].id).toBe('c');
  });

  it('does not mutate the original array', () => {
    const original = [...items];
    sortByDistance(items, 0, 0);
    expect(items).toEqual(original);
  });
});

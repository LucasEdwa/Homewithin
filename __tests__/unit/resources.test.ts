import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');
jest.mock('@/services/supabase', () => ({ supabase: null, isSupabaseConfigured: false }));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;

// Reset per-test
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  mockStore.getItemAsync.mockImplementation(async (key) => store[key] ?? null);
  mockStore.setItemAsync.mockImplementation(async (key, value) => { store[key] = value; });
  mockStore.deleteItemAsync.mockImplementation(async (key) => { delete store[key]; });
});

import { getResources, getResourceById, getBookmarks, isBookmarked, toggleBookmark, getBookmarkedResources } from '@/services/content/resources';
import { SEED_ARTICLES } from '@/data/articles';

describe('getResources', () => {
  it('returns all seed articles when Supabase is null', async () => {
    const results = await getResources();
    expect(results.length).toBe(SEED_ARTICLES.length);
  });

  it('filters by category', async () => {
    const results = await getResources('family_rejection');
    expect(results.every((r) => r.category === 'family_rejection')).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns 2 articles per category', async () => {
    const cats = ['family_rejection', 'internalized_shame', 'religious_trauma', 'boundaries', 'coming_out_safely', 'crisis_help'] as const;
    for (const cat of cats) {
      const results = await getResources(cat);
      expect(results.length).toBe(2);
    }
  });
});

describe('getResourceById', () => {
  it('returns article by id from seed', async () => {
    const article = await getResourceById('fr-001');
    expect(article).not.toBeNull();
    expect(article!.title).toBe('When Your Family Says No');
  });

  it('returns null for unknown id', async () => {
    const article = await getResourceById('does-not-exist');
    expect(article).toBeNull();
  });
});

describe('bookmarks', () => {
  it('starts with empty bookmarks', async () => {
    const bms = await getBookmarks();
    expect(bms).toEqual([]);
  });

  it('toggleBookmark adds an id', async () => {
    const nowBookmarked = await toggleBookmark('fr-001');
    expect(nowBookmarked).toBe(true);
    const bms = await getBookmarks();
    expect(bms).toContain('fr-001');
  });

  it('toggleBookmark removes an id on second call', async () => {
    await toggleBookmark('fr-001');
    const nowBookmarked = await toggleBookmark('fr-001');
    expect(nowBookmarked).toBe(false);
    const bms = await getBookmarks();
    expect(bms).not.toContain('fr-001');
  });

  it('isBookmarked returns false before toggle', async () => {
    expect(await isBookmarked('fr-001')).toBe(false);
  });

  it('isBookmarked returns true after toggle', async () => {
    await toggleBookmark('fr-001');
    expect(await isBookmarked('fr-001')).toBe(true);
  });

  it('getBookmarkedResources returns full articles', async () => {
    await toggleBookmark('fr-001');
    await toggleBookmark('is-001');
    const results = await getBookmarkedResources();
    expect(results.map((r) => r.id)).toContain('fr-001');
    expect(results.map((r) => r.id)).toContain('is-001');
  });

  it('getBookmarkedResources returns empty when no bookmarks', async () => {
    const results = await getBookmarkedResources();
    expect(results).toEqual([]);
  });
});

import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { SEED_ARTICLES } from '@/constants/articles';
import type { Resource, ResourceCategory } from '@/types';

const BOOKMARKS_KEY = 'hw_bookmarks';

export async function getResources(category?: ResourceCategory): Promise<Resource[]> {
  if (supabase) {
    let query = supabase.from('resources').select('*').order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as Resource[];
    }
  }
  const articles = category ? SEED_ARTICLES.filter((a) => a.category === category) : SEED_ARTICLES;
  return articles;
}

export async function getResourceById(id: string): Promise<Resource | null> {
  if (supabase) {
    const { data, error } = await supabase.from('resources').select('*').eq('id', id).single();
    if (!error && data) return data as Resource;
  }
  return SEED_ARTICLES.find((a) => a.id === id) ?? null;
}

export async function getBookmarks(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(BOOKMARKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function isBookmarked(id: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  return bookmarks.includes(id);
}

export async function toggleBookmark(id: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  const exists = bookmarks.includes(id);
  const updated = exists ? bookmarks.filter((b) => b !== id) : [id, ...bookmarks];
  await SecureStore.setItemAsync(BOOKMARKS_KEY, JSON.stringify(updated));
  return !exists;
}

export async function getBookmarkedResources(): Promise<Resource[]> {
  const ids = await getBookmarks();
  if (ids.length === 0) return [];
  const all = await getResources();
  return ids.map((id) => all.find((a) => a.id === id)).filter(Boolean) as Resource[];
}

import * as SecureStore from 'expo-secure-store';
import { supabase } from '../supabase';
import { SEED_ARTICLES } from '@/data/articles';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/content';
import type { Resource, ResourceCategory } from '@/types';

export interface ResourceCategoryMeta {
  id: ResourceCategory;
  label: string;
  color: string;
  sort_order: number;
}

export async function getResourceCategories(): Promise<ResourceCategoryMeta[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('resource_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data && data.length > 0) {
      return data as ResourceCategoryMeta[];
    }
  }
  // Local fallback
  return (Object.keys(CATEGORY_LABELS) as ResourceCategory[]).map((id, i) => ({
    id,
    label: CATEGORY_LABELS[id],
    color: CATEGORY_COLORS[id],
    sort_order: i + 1,
  }));
}

const BOOKMARKS_KEY = 'hw_bookmarks';

// Supabase returns snake_case columns; map them to the camelCase Resource type.
function rowToResource(row: Record<string, unknown>): Resource {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: row.summary as string,
    body: row.body as string,
    category: row.category as ResourceCategory,
    language: row.language as string,
    readTime: (row.read_time ?? row.readTime ?? 0) as number,
    createdAt: (row.created_at ?? row.createdAt ?? '') as string,
  };
}

export async function getResources(category?: ResourceCategory, language = 'en'): Promise<Resource[]> {
  if (supabase) {
    let query = supabase
      .from('resources')
      .select('*')
      .eq('language', language)
      .order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data.map(rowToResource);
  }
  const articles = category ? SEED_ARTICLES.filter((a) => a.category === category) : SEED_ARTICLES;
  return articles;
}

export async function getResourceById(id: string): Promise<Resource | null> {
  if (supabase) {
    const { data, error } = await supabase.from('resources').select('*').eq('id', id).single();
    if (!error && data) return rowToResource(data as Record<string, unknown>);
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
  if (supabase) {
    const { data, error } = await supabase.from('resources').select('*').in('id', ids);
    if (!error && data) return data.map(rowToResource);
  }
  return SEED_ARTICLES.filter((a) => ids.includes(a.id));
}

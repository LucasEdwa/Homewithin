import * as SecureStore from 'expo-secure-store';
import { currentUserId, supabase } from './supabase';

const STORE_KEY = 'hw_last_read';

async function loadMap(): Promise<Record<string, string>> {
  const raw = await SecureStore.getItemAsync(STORE_KEY).catch(() => null);
  return raw ? JSON.parse(raw) : {};
}

async function saveMap(map: Record<string, string>): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(map)).catch(() => {});
}

export async function markMatchRead(matchId: string): Promise<void> {
  const map = await loadMap();
  map[matchId] = new Date().toISOString();
  await saveMap(map);
}

export async function getUnreadCounts(
  matchIds: string[],
): Promise<Record<string, number>> {
  if (!supabase || matchIds.length === 0) return {};
  const uid = await currentUserId();
  if (!uid) return {};

  const lastReadMap = await loadMap();

  const counts = await Promise.all(
    matchIds.map(async (matchId) => {
      const since = lastReadMap[matchId] ?? new Date(0).toISOString();
      const { count } = await supabase!
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .neq('sender_id', uid)
        .gt('created_at', since);
      return { matchId, count: count ?? 0 };
    }),
  );

  return Object.fromEntries(counts.map(({ matchId, count }) => [matchId, count]));
}

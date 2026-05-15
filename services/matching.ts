import { supabase } from './supabase';
import type { Match, PeerProfile, IntentionId } from '@/types';
import type { UserProfile } from '@/context/SessionContext';

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  return user?.id ?? null;
}

export async function getMatchPeerId(matchId: string): Promise<string | null> {
  if (!supabase) return null;
  const uid = await currentUserId();
  if (!uid) return null;

  const { data, error } = await supabase
    .from('matches')
    .select('requester_id, target_id')
    .eq('id', matchId)
    .single();
  if (error || !data) {
    console.error('Lookup match peer failed:', error?.message);
    return null;
  }
  return data.requester_id === uid ? data.target_id : data.requester_id;
}

export async function syncProfile(profile: UserProfile): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;

  const { error } = await supabase.from('user_profiles').upsert({
    user_id: uid,
    nickname: profile.nickname,
    age_range: profile.ageRange,
    language: profile.language,
    country: profile.country,
    hide_from_search: profile.hideFromSearch,
    needs: profile.needs,
    intentions: profile.intentions ?? [],
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('Profile sync failed:', error.message);
}

export async function findMatches(intention: IntentionId, limit = 10): Promise<PeerProfile[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const [{ data: interacted }, { data: blocked }] = await Promise.all([
    supabase.from('matches').select('requester_id, target_id').or(`requester_id.eq.${uid},target_id.eq.${uid}`),
    supabase.from('blocks').select('blocker_id, blocked_id').or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`),
  ]);

  const exclude = new Set<string>([uid]);
  (interacted ?? []).forEach((m: any) => { exclude.add(m.requester_id); exclude.add(m.target_id); });
  (blocked ?? []).forEach((b: any) => { exclude.add(b.blocker_id); exclude.add(b.blocked_id); });

  // Supabase doesn't support `not in` with a Set directly — build the array
  const excludeArr = Array.from(exclude);

  let query = supabase
    .from('user_profiles')
    .select('user_id, nickname, age_range, language, country, needs, intentions')
    .eq('hide_from_search', false)
    // Only surface peers who marked themselves open to this intention.
    .contains('intentions', [intention])
    .limit(limit);

  // Filter out excluded users one by one (Supabase supports neq chaining)
  excludeArr.forEach((id) => { query = query.neq('user_id', id); });

  const { data, error } = await query;
  if (error) { console.error('Find matches failed:', error.message); return []; }

  return (data ?? []).map((row: any) => ({
    userId: row.user_id,
    nickname: row.nickname,
    ageRange: row.age_range ?? undefined,
    language: row.language ?? undefined,
    country: row.country ?? undefined,
    needs: row.needs ?? [],
  }));
}

export async function connectMatch(targetId: string, intention: IntentionId): Promise<string | null> {
  if (!supabase) return null;
  const uid = await currentUserId();
  if (!uid) return null;

  const { data, error } = await supabase
    .from('matches')
    .insert({ requester_id: uid, target_id: targetId, intention, status: 'accepted' })
    .select('id')
    .single();

  if (error) { console.error('Connect failed:', error.message); return null; }
  return data?.id ?? null;
}

export async function passMatch(targetId: string, intention: IntentionId): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;

  const { error } = await supabase
    .from('matches')
    .insert({ requester_id: uid, target_id: targetId, intention, status: 'passed' });
  if (error) console.error('Pass failed:', error.message);
}

export async function getMyMatches(): Promise<Match[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from('matches')
    .select('id, requester_id, target_id, intention, status, created_at')
    .eq('requester_id', uid)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });

  if (error) { console.error('Get matches failed:', error.message); return []; }
  if (!data || data.length === 0) return [];

  // Fetch peer profiles separately to avoid join complexity
  const targetIds = data.map((m: any) => m.target_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, nickname, age_range, language, country, needs')
    .in('user_id', targetIds);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

  return data.map((row: any) => {
    const p = profileMap.get(row.target_id) as any;
    return {
      id: row.id,
      requesterId: row.requester_id,
      targetId: row.target_id,
      intention: row.intention,
      status: row.status,
      createdAt: row.created_at,
      peer: p ? {
        userId: p.user_id,
        nickname: p.nickname,
        ageRange: p.age_range ?? undefined,
        language: p.language ?? undefined,
        country: p.country ?? undefined,
        needs: p.needs ?? [],
      } : undefined,
    };
  });
}

export async function blockUser(targetId: string, matchId?: string): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  if (uid === targetId) {
    console.error('Block failed: cannot block yourself');
    return false;
  }

  // Upsert so re-blocking the same user is a no-op instead of a unique-constraint error.
  const { error: blockError } = await supabase
    .from('blocks')
    .upsert(
      { blocker_id: uid, blocked_id: targetId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
    );
  if (blockError) {
    console.error('Block failed:', blockError.message);
    return false;
  }

  if (matchId) {
    const { error: matchError } = await supabase
      .from('matches')
      .update({ status: 'blocked' })
      .eq('id', matchId);
    if (matchError) {
      console.error('Block: failed to update match status:', matchError.message);
      // Block itself succeeded — still return true.
    }
  }

  return true;
}

export async function unblockUser(targetId: string): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUserId();
  if (!uid) return false;

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', uid)
    .eq('blocked_id', targetId);
  if (error) {
    console.error('Unblock failed:', error.message);
    return false;
  }
  return true;
}

export async function getBlockedUserIds(): Promise<string[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', uid);
  if (error) {
    console.error('Get blocked users failed:', error.message);
    return [];
  }
  return (data ?? []).map((row: any) => row.blocked_id);
}

export type BlockedUser = {
  userId: string;
  nickname: string;
  createdAt: string;
};

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data: blocks, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', uid)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get blocked users failed:', error.message);
    return [];
  }
  if (!blocks || blocks.length === 0) return [];

  const ids = blocks.map((b: any) => b.blocked_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, nickname')
    .in('user_id', ids);

  const nameMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.nickname]));

  return blocks.map((b: any) => ({
    userId: b.blocked_id,
    nickname: nameMap.get(b.blocked_id) ?? 'Anonymous',
    createdAt: b.created_at,
  }));
}

export async function reportUser(targetId: string, reason: string): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;

  const { error } = await supabase.from('reports').insert({ reporter_id: uid, reported_id: targetId, reason });
  if (error) console.error('Report user failed:', error.message);
}

export async function reportMessage(messageId: string, targetId: string, reason: string): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;

  const { error } = await supabase.from('reports').insert({
    reporter_id: uid,
    reported_id: targetId,
    message_id: messageId,
    reason,
  });
  if (error) console.error('Report message failed:', error.message);
}

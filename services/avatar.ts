import { currentUserId, supabase } from './supabase';

const BUCKET = 'avatars';

export async function uploadAvatar(localUri: string): Promise<string> {
  const userId = await currentUserId();
  if (!userId || !supabase) throw new Error('Not authenticated');

  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Bust any CDN cache by appending a timestamp
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteAvatar(): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !supabase) return;

  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  const paths = extensions.map((ext) => `${userId}/avatar.${ext}`);
  await supabase.storage.from(BUCKET).remove(paths).catch(() => {});
}

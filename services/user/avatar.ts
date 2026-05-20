import * as FileSystem from 'expo-file-system/legacy';
import { currentUserId, supabase } from '../supabase';

const BUCKET = 'avatars';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export async function uploadAvatar(localUri: string, mimeType?: string): Promise<string> {
  const userId = await currentUserId();
  if (!userId || !supabase) throw new Error('Not authenticated');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session');

  const mime = mimeType ?? 'image/jpeg';
  const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

  // FileSystem.uploadAsync uses the native HTTP stack, which correctly handles
  // both file:// and content:// URIs on Android without the blob/arrayBuffer issues.
  const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT as any,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': mime,
      'x-upsert': 'true',
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed (${result.status}): ${result.body}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteAvatar(): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !supabase) return;

  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  const paths = extensions.map((ext) => `${userId}/avatar.${ext}`);
  await supabase.storage.from(BUCKET).remove(paths).catch(() => {});
}

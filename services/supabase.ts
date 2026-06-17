import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch {
      // Silently return null on background / locked-keychain failures so
      // Supabase auth auto-refresh ticks don't crash the app.
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch {
      // ignore — Supabase will retry
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

// Guard: createClient crashes if URL is empty. When env vars are missing (e.g. before
// the user adds their Supabase project credentials), export null so the app can still
// boot — only auth-gated screens will be affected.
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: ExpoSecureStoreAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  return user?.id ?? null;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  const { deleteSensitiveData } = await import('@/services/storage');
  await deleteSensitiveData().catch(() => {});
}

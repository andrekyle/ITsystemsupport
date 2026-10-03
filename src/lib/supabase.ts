import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const cloudRequested =
  import.meta.env.PROD || import.meta.env.VITE_ENABLE_CLOUD === "true";

export const SUPABASE_URL = url ?? "";
export const SUPABASE_ANON_KEY = anonKey ?? "";

/**
 * Supabase client — null when the env vars are not configured, in which case
 * the app runs in local-only mode (everything stays in this browser). Local
 * development is local-only by default so configured deployment credentials
 * don't prevent running the app without Supabase access.
 */
export const supabase: SupabaseClient | null =
  url && anonKey && cloudRequested ? createClient(url, anonKey) : null;

export const cloudEnabled = supabase !== null;

/** Headless Supabase client that never persists a session. Used to sign an
 *  admin-provisioned user up without hijacking the current admin session. */
export function makeHeadlessClient(): SupabaseClient | null {
  if (!url || !anonKey || !cloudRequested) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

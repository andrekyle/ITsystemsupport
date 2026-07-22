import { supabase } from "./supabase";
import type { PoeDoc, Profile } from "../types";

export interface CloudDirectory {
  /** profiles synced by other signed-in accounts (this account's own rows excluded) */
  profiles: Profile[];
  /** profile id -> uploaded POE documents */
  poe: Record<string, Record<string, PoeDoc>>;
}

/**
 * Reads every account's synced profiles and POE document indexes so staff can
 * see users who sign in with their own email accounts. Requires the read-all
 * SELECT policy on app_state (supabase/schema.sql) — without it, only the
 * current account's rows come back and this returns an empty directory.
 */
export async function fetchCloudDirectory(): Promise<CloudDirectory | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;

  const [profRes, poeRes] = await Promise.all([
    supabase.from("app_state").select("user_id,value").eq("key", "itss.profiles"),
    supabase.from("app_state").select("user_id,key,value").like("key", "itss.poe.%"),
  ]);
  if (profRes.error || poeRes.error) return null;

  const profiles: Profile[] = [];
  const seen = new Set<string>();
  for (const row of profRes.data ?? []) {
    if (row.user_id === me) continue; // this account's profiles are already local
    try {
      for (const p of JSON.parse(row.value) as Profile[]) {
        if (p?.id && !seen.has(p.id)) {
          seen.add(p.id);
          profiles.push(p);
        }
      }
    } catch {
      /* ignore malformed rows */
    }
  }

  const poe: CloudDirectory["poe"] = {};
  for (const row of poeRes.data ?? []) {
    const pid = row.key.slice("itss.poe.".length);
    try {
      poe[pid] = { ...(poe[pid] ?? {}), ...(JSON.parse(row.value) as Record<string, PoeDoc>) };
    } catch {
      /* ignore malformed rows */
    }
  }

  return { profiles, poe };
}

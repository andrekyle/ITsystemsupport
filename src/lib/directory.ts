import { supabase } from "./supabase";
import type { PoeDoc, Profile } from "../types";

export interface CloudDirectory {
  /** profiles synced by other signed-in accounts (this account's own rows excluded) */
  profiles: Profile[];
  /** profile id -> uploaded POE documents */
  poe: Record<string, Record<string, PoeDoc>>;
  /** profile id -> owning auth user id (for cross-account management) */
  owners: Record<string, string>;
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
  const owners: CloudDirectory["owners"] = {};
  const seen = new Set<string>();
  for (const row of profRes.data ?? []) {
    if (row.user_id === me) continue; // this account's profiles are already local
    try {
      for (const p of JSON.parse(row.value) as Profile[]) {
        if (p?.id && !seen.has(p.id)) {
          seen.add(p.id);
          // only the designated account may hold the Super User role
          profiles.push(p.role === "Super User" ? { ...p, role: "Facilitator" } : p);
          owners[p.id] = row.user_id;
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

  return { profiles, poe, owners };
}

const RLS_HINT =
  "Could not save to the cloud — make sure the latest supabase/schema.sql has been run and your account has been added to the admins table.";

async function readOwnerProfiles(owner: string): Promise<Profile[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_state")
    .select("value")
    .eq("user_id", owner)
    .eq("key", "itss.profiles")
    .maybeSingle();
  if (error || !data) return null;
  try {
    return JSON.parse(data.value) as Profile[];
  } catch {
    return null;
  }
}

async function writeOwnerProfiles(owner: string, profiles: Profile[]): Promise<string | null> {
  if (!supabase) return "Cloud sync is not configured.";
  const { error } = await supabase.from("app_state").upsert(
    {
      user_id: owner,
      key: "itss.profiles",
      value: JSON.stringify(profiles),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" }
  );
  return error ? RLS_HINT : null;
}

/** Update a profile that lives in another account's cloud storage.
 *  Returns an error message, or null on success. The change reaches the
 *  account owner the next time their app loads. */
export async function updateCloudProfile(
  owner: string,
  profileId: string,
  patch: Partial<Profile>
): Promise<string | null> {
  const profiles = await readOwnerProfiles(owner);
  if (!profiles) return RLS_HINT;
  const next = profiles.map((p) => (p.id === profileId ? { ...p, ...patch } : p));
  return writeOwnerProfiles(owner, next);
}

/** Delete a profile (and its saved data) from another account's cloud storage.
 *  Returns an error message, or null on success. */
export async function deleteCloudProfile(owner: string, profileId: string): Promise<string | null> {
  if (!supabase) return "Cloud sync is not configured.";
  const profiles = await readOwnerProfiles(owner);
  if (!profiles) return RLS_HINT;
  const err = await writeOwnerProfiles(
    owner,
    profiles.filter((p) => p.id !== profileId)
  );
  if (err) return err;
  const dataKeys = [
    `itss.progress.${profileId}`,
    `itss.poe.${profileId}`,
    `itss.notes.${profileId}`,
    `itss.noteorder.${profileId}`,
    `itss.notetitles.${profileId}`,
    `itss.checklist.${profileId}`,
    `itss.sectiond.${profileId}`,
  ];
  await supabase.from("app_state").delete().eq("user_id", owner).in("key", dataKeys);
  return null;
}

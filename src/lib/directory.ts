import { supabase } from "./supabase";
import type { PoeDoc, Profile, ProgressState } from "../types";

export interface CloudDirectory {
  /** profiles synced by other signed-in accounts (this account's own rows excluded) */
  profiles: Profile[];
  /** profile id -> uploaded POE documents */
  poe: Record<string, Record<string, PoeDoc>>;
  /** profile id -> owning auth user id (for cross-account management) */
  owners: Record<string, string>;
}

/** Every identity token that identifies a person — the same profile on a
 *  different device may have a partially-filled enrolment, so we index by
 *  every token and match if *any* one lines up. */
export function identityKeys(p: Profile): string[] {
  const keys: string[] = [];
  const id = (p.enrolment?.idNumber ?? "").trim().toLowerCase();
  if (id) keys.push(`id:${id}`);
  const email = (p.enrolment?.email ?? "").trim().toLowerCase();
  if (email) keys.push(`em:${email}`);
  const name = (p.name ?? "").trim().toLowerCase();
  if (name) keys.push(`nm:${name}`);
  const enrolFull = [
    (p.enrolment?.firstNames ?? "").trim(),
    (p.enrolment?.surname ?? "").trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (enrolFull && enrolFull !== name) keys.push(`nm:${enrolFull}`);
  return keys;
}

/** True when `a` is a strictly newer ISO login timestamp than `b`. */
function newerLoginTs(a?: string, b?: string): boolean {
  return (a ? Date.parse(a) : 0) > (b ? Date.parse(b) : 0);
}

/** Cloud profiles that are not already represented locally (by id or any
 *  identity token), with duplicate cloud copies of the same person collapsed
 *  to the freshest one. */
export function remoteOnlyProfiles(local: Profile[], cloudProfiles: Profile[]): Profile[] {
  const localIds = new Set(local.map((p) => p.id));
  const localKeys = new Set<string>();
  for (const p of local) for (const k of identityKeys(p)) localKeys.add(k);
  const remote = cloudProfiles.filter(
    (p) => !localIds.has(p.id) && !identityKeys(p).some((k) => localKeys.has(k))
  );
  const deduped: Profile[] = [];
  const chosen = new Map<string, Profile>();
  for (const p of remote) {
    const keys = identityKeys(p);
    const existingKey = keys.find((k) => chosen.has(k));
    if (!existingKey) {
      for (const k of keys) chosen.set(k, p);
      deduped.push(p);
    } else {
      const cur = chosen.get(existingKey)!;
      if (newerLoginTs(p.lastLogin, cur.lastLogin)) {
        const idx = deduped.indexOf(cur);
        if (idx >= 0) deduped[idx] = p;
        for (const k of identityKeys(cur)) if (chosen.get(k) === cur) chosen.delete(k);
        for (const k of keys) chosen.set(k, p);
      }
    }
  }
  return deduped;
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
  // Same profile id can appear in more than one account's row (e.g. the
  // facilitator seeded a learner via People > Add User and that learner also
  // signs in on their own device). We keep the *freshest* copy — the one
  // with the most recent lastLogin — and prefer the profile's own account
  // (owner === profile.ownerHint) when timestamps tie.
  const chosen = new Map<string, { p: Profile; owner: string }>();
  const loginTime = (p: Profile) => (p.lastLogin ? Date.parse(p.lastLogin) : 0);
  for (const row of profRes.data ?? []) {
    if (row.user_id === me) continue; // this account's profiles are already local
    try {
      for (const p of JSON.parse(row.value) as Profile[]) {
        if (!p?.id) continue;
        const cur = chosen.get(p.id);
        // Own row wins on ties; newer lastLogin always wins.
        const incomingOwn = row.user_id === p.id; /* rare */
        const t = loginTime(p);
        if (!cur) {
          chosen.set(p.id, { p, owner: row.user_id });
        } else {
          const curT = loginTime(cur.p);
          if (t > curT || (t === curT && incomingOwn && cur.owner !== p.id)) {
            chosen.set(p.id, { p, owner: row.user_id });
          }
        }
      }
    } catch {
      /* ignore malformed rows */
    }
  }
  for (const { p, owner } of chosen.values()) {
    // only the designated account may hold the Super User role
    profiles.push(p.role === "Super User" ? { ...p, role: "Facilitator" } : p);
    owners[p.id] = owner;
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

/** Purge a profile from the current account's cloud snapshot: overwrite this
 *  account's own itss.profiles row (with the profile filtered out) and delete
 *  its data keys. Runs *directly* against Supabase — bypasses the debounced
 *  sync layer so nothing can race the removal. Returns an error message, or
 *  null on success. */
export async function purgeOwnProfileCopy(profileId: string): Promise<string | null> {
  if (!supabase) return null; // local-only mode: nothing to purge
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) return "Not signed in to the cloud — nothing to sync.";
  const me = auth.user.id;

  // Read *this* account's own profiles row and strip the target profile out.
  const { data: profRow, error: readErr } = await supabase
    .from("app_state")
    .select("value")
    .eq("user_id", me)
    .eq("key", "itss.profiles")
    .maybeSingle();
  if (readErr) return `Could not read cloud profiles: ${readErr.message}`;

  if (profRow) {
    let list: Profile[] = [];
    try {
      list = (JSON.parse(profRow.value) as Profile[]).filter((p) => p?.id && p.id !== profileId);
    } catch {
      list = [];
    }
    const { error: writeErr } = await supabase.from("app_state").upsert(
      {
        user_id: me,
        key: "itss.profiles",
        value: JSON.stringify(list),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,key" }
    );
    if (writeErr) return `Could not update cloud profiles: ${writeErr.message}`;
  }

  const dataKeys = [
    `itss.progress.${profileId}`,
    `itss.poe.${profileId}`,
    `itss.notes.${profileId}`,
    `itss.noteorder.${profileId}`,
    `itss.notetitles.${profileId}`,
    `itss.checklist.${profileId}`,
    `itss.sectiond.${profileId}`,
  ];
  const { error: delErr } = await supabase
    .from("app_state")
    .delete()
    .eq("user_id", me)
    .in("key", dataKeys);
  if (delErr) return `Could not delete cloud data rows: ${delErr.message}`;
  return null;
}

export interface CloudLearnerData extends CloudDirectory {
  /** profile id -> saved progress from the owning account */
  progress: Record<string, ProgressState>;
  /** profile id -> Appendix C checklist ticks from the owning account */
  checklists: Record<string, Record<string, "yes" | "no">>;
}

/**
 * Directory plus each learner's progress and Appendix C checklist, for
 * cross-account reporting (compliance records). Rows from the profile's
 * owning account win when several accounts hold a copy of the same key.
 */
export async function fetchCloudLearnerData(): Promise<CloudLearnerData | null> {
  if (!supabase) return null;
  const [dir, progRes, checkRes] = await Promise.all([
    fetchCloudDirectory(),
    supabase.from("app_state").select("user_id,key,value").like("key", "itss.progress.%"),
    supabase.from("app_state").select("user_id,key,value").like("key", "itss.checklist.%"),
  ]);
  if (!dir) return null;

  const pick = <T,>(
    rows: { user_id: string; key: string; value: string }[] | null,
    prefix: string
  ): Record<string, T> => {
    const out: Record<string, T> = {};
    for (const row of rows ?? []) {
      const pid = row.key.slice(prefix.length);
      // the owning account's copy wins; otherwise first row seen
      if (pid in out && dir.owners[pid] !== row.user_id) continue;
      try {
        out[pid] = JSON.parse(row.value) as T;
      } catch {
        /* ignore malformed rows */
      }
    }
    return out;
  };

  return {
    ...dir,
    progress: pick<ProgressState>(progRes.error ? null : progRes.data, "itss.progress."),
    checklists: pick<Record<string, "yes" | "no">>(
      checkRes.error ? null : checkRes.data,
      "itss.checklist."
    ),
  };
}

/** Read a profile's saved progress (quiz/exercise scores) from its owning
 *  account's cloud storage — used when staff view users from other accounts. */
export async function fetchCloudProgress(
  owner: string,
  profileId: string
): Promise<ProgressState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_state")
    .select("value")
    .eq("user_id", owner)
    .eq("key", `itss.progress.${profileId}`)
    .maybeSingle();
  if (error || !data) return null;
  try {
    return JSON.parse(data.value) as ProgressState;
  } catch {
    return null;
  }
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

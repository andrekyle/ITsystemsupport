import { supabase } from "./supabase";
import type { PoeDoc, Profile, ProgressState } from "../types";

/**
 * Cloud sync for the app's localStorage state.
 *
 * Every `itss.*` key (except device-local ones) is mirrored to the
 * `app_state` table in Supabase, one row per key, scoped to the signed-in
 * auth user. On login the cloud snapshot is written into localStorage before
 * the app renders, so every existing hook keeps working unchanged.
 */

const PREFIX = "itss.";
/** device-local keys that should not follow the account across devices */
const LOCAL_ONLY = new Set(["itss.session", "itss.route", "itss.theme"]);

/** keys whose content is shared with every account (facilitator uploads) */
function isShared(key: string) {
  return (
    key === "itss.notes.shared" ||
    key === "itss.settings.shared" ||
    key.startsWith("itss.planslides.") ||
    key.startsWith("itss.roster.")
  );
}

/** keys whose changes should be re-published to this account's shared roster */
function isRosterSource(key: string) {
  return (
    key === "itss.profiles" ||
    key.startsWith("itss.progress.") ||
    key.startsWith("itss.poe.")
  );
}

let userId: string | null = null;
let hydrating = false;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let rosterTimer: ReturnType<typeof setTimeout> | null = null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Publish this account's profiles, progress and POE metadata to the shared
 * `itss.roster.<auth-uid>` key so facilitators and the super user can see
 * every learner across accounts. Password hashes, avatars and inline file
 * data are stripped before publishing.
 */
function publishRoster() {
  if (!userId) return;
  const profiles = readJson<Profile[]>("itss.profiles", []);
  if (profiles.length === 0) return;
  const progress: Record<string, ProgressState> = {};
  const poe: Record<string, Record<string, PoeDoc>> = {};
  for (const p of profiles) {
    delete p.passwordHash;
    delete p.avatar;
    const prog = readJson<ProgressState | null>(`itss.progress.${p.id}`, null);
    if (prog) progress[p.id] = prog;
    const docs = readJson<Record<string, PoeDoc> | null>(`itss.poe.${p.id}`, null);
    if (docs && Object.keys(docs).length) {
      const slim: Record<string, PoeDoc> = {};
      for (const [item, doc] of Object.entries(docs)) {
        const { data: _inline, ...rest } = doc;
        slim[item] = rest;
      }
      poe[p.id] = slim;
    }
  }
  localStorage.setItem(
    `itss.roster.${userId}`,
    JSON.stringify({ updatedAt: new Date().toISOString(), profiles, progress, poe })
  );
}

function queueRoster() {
  if (hydrating || !userId) return;
  if (rosterTimer) clearTimeout(rosterTimer);
  rosterTimer = setTimeout(() => {
    rosterTimer = null;
    publishRoster();
  }, 800);
}

function syncable(key: string) {
  return key.startsWith(PREFIX) && !LOCAL_ONLY.has(key);
}

async function pushKey(key: string, value: string | null) {
  if (!supabase || !userId) return;
  try {
    if (isShared(key)) {
      if (value === null) {
        await supabase.from("shared_state").delete().eq("key", key);
      } else {
        await supabase
          .from("shared_state")
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      }
    } else if (value === null) {
      await supabase.from("app_state").delete().eq("user_id", userId).eq("key", key);
    } else {
      await supabase
        .from("app_state")
        .upsert(
          { user_id: userId, key, value, updated_at: new Date().toISOString() },
          { onConflict: "user_id,key" }
        );
    }
  } catch {
    // offline / transient errors: the key stays in localStorage and will be
    // pushed again the next time it is written
  }
}

function queue(key: string, value: string | null) {
  if (hydrating) return;
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      void pushKey(key, value);
    }, 600)
  );
}

/**
 * Patch localStorage so every write/removal of a syncable key is mirrored to
 * the cloud. Installed once at startup; harmless in local-only mode because
 * pushes are no-ops until a user id is set.
 */
export function installSync() {
  const set = localStorage.setItem.bind(localStorage);
  const remove = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = (key: string, value: string) => {
    set(key, value);
    if (syncable(key)) queue(key, value);
    if (isRosterSource(key)) queueRoster();
  };
  localStorage.removeItem = (key: string) => {
    remove(key);
    if (syncable(key)) queue(key, null);
    if (isRosterSource(key)) queueRoster();
  };
}

/**
 * Hydrate localStorage from the signed-in user's cloud snapshot, then push up
 * any local keys the cloud does not have yet (first login from this device).
 * Cloud values win for keys present in both.
 */
export async function startSync(authUserId: string): Promise<void> {
  userId = authUserId;
  if (!supabase) return;

  const [own, shared] = await Promise.all([
    supabase.from("app_state").select("key,value"),
    supabase.from("shared_state").select("key,value"),
  ]);
  if (own.error) return; // stay on local data rather than blocking the app

  hydrating = true;
  const cloudKeys = new Set<string>();
  for (const row of own.data ?? []) {
    cloudKeys.add(row.key);
    localStorage.setItem(row.key, row.value);
  }
  for (const row of shared.error ? [] : shared.data ?? []) {
    cloudKeys.add(row.key);
    localStorage.setItem(row.key, row.value);
  }
  hydrating = false;

  // push local-only data (e.g. work done before cloud sync was configured)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && syncable(key) && !cloudKeys.has(key)) {
      const value = localStorage.getItem(key);
      if (value !== null) void pushKey(key, value);
    }
  }

  // publish this account's roster so staff on other accounts can see it
  publishRoster();
}

export function stopSync() {
  userId = null;
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  if (rosterTimer) {
    clearTimeout(rosterTimer);
    rosterTimer = null;
  }
}

/** Remove all synced app data from this browser (used on cloud sign-out). */
export function wipeLocalData() {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX) && key !== "itss.theme") doomed.push(key);
  }
  for (const key of doomed) localStorage.removeItem(key);
}

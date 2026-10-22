import { supabase } from "./supabase";
import { isLargeStateKey, receiveUnitPack, storedUnitPacks, clearUnitPacks } from "./unitStorage";
import { receiveLessonEdits } from "./lessonEditStore";
import {
  PENDING_KEY,
  pendingWrites,
  loadPendingWrites,
  rememberPendingWrite,
  forgetPendingWrite,
  waitForPendingWrites,
} from "./syncPendingStorage";
import {
  clearOnboardingPacks,
  ONBOARDING_KEY,
  receiveOnboardingPacks,
  storedOnboardingPacks,
} from "./onboardingStorage";
import { TENANT_ID } from "./tenant";

/**
 * Cloud sync for the app's localStorage state.
 *
 * Every `itss.*` key (except device-local ones) is mirrored to the
 * `app_state` table in Supabase, one row per key, scoped to the signed-in
 * auth user. On login the cloud snapshot is written into localStorage before
 * the app renders, so every existing hook keeps working unchanged.
 * Pending payloads live in IndexedDB, including legacy syncPending migration,
 * so file data is never duplicated into quota-limited localStorage.
 * Pending queues are tenant-isolated. Unowned legacy poll caches are never
 * seeded into cloud state; Voting loads the tenant's authoritative record.
 */

const PREFIX = "itss.";
const UNIT_BUILDER_SAVE_PROBE = "unitbuilder-save-probe.";
const ATTENDANCE_REGISTER_RE = /^itss\.attendance\.(\d{4}-\d{2}-\d{2})$/;
const attendanceMigrationKey = (date: string) => `itssDevice.attendanceMigrated.${date}`;
/** device-local keys that should not follow the account across devices */
const LOCAL_ONLY = new Set(["itss.session", "itss.route", "itss.theme", "itss.activeCourse", PENDING_KEY]);

/** keys whose content is shared with every account (facilitator uploads,
 *  attendance registers, announcements, Q&A, reviews, outcomes, audit trail) */
function isShared(key: string) {
  return (
    key.endsWith(".shared") ||
    key.startsWith("itss.planslides.") ||
    key.startsWith("itss.deckoverrides.") ||
    key.startsWith("itss.lessonfigs.") ||
    key.startsWith("itss.lessonedits.") ||
    key.startsWith("itss.attendance.")
  );
}

let userId: string | null = null;
let hydrating = false;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
// the untouched setter, captured before installSync() wraps it
const rawSet = localStorage.setItem.bind(localStorage);
function rememberPending(key: string, value: string | null) {
  if (!userId) return Promise.resolve();
  return rememberPendingWrite({ userId, key, value, revision: crypto.randomUUID() });
}
function pendingFor(key: string) {
  return pendingWrites().find(write => write.userId === userId && write.key === key);
}

/** Whether the current account still has an unsent value for this key. */
export function hasPendingCloudWrite(key: string): boolean {
  return !!pendingFor(key);
}
const pushes = new Map<string, Promise<boolean>>();
const pushErrors = new Map<string, string>();

/** Store a value that was just pulled FROM the cloud without echoing it back
 *  up — an echo could land after someone else's newer save and undo it. */
export function writeFromCloud(key: string, value: string) {
  if (key.startsWith(UNIT_BUILDER_SAVE_PROBE)) return;
  if (key.startsWith("itss.presence.")) return;
  if (pendingFor(key)) return;
  if (key === ONBOARDING_KEY) {
    receiveOnboardingPacks(value);
    return;
  }
  if(isLargeStateKey(key)){receiveUnitPack(key,value);return;}
  if(key.startsWith("itss.lessonedits.")){receiveLessonEdits(key,value);return;}
  const attendanceMatch = key.match(ATTENDANCE_REGISTER_RE);
  if (attendanceMatch && !localStorage.getItem(attendanceMigrationKey(attendanceMatch[1]))) {
    // One-time recovery for legacy registers: different devices may hold
    // rows that were lost when the old whole-register cloud blob was last
    // overwritten. Preserve the union until AttendancePage has uploaded each
    // row into its new collision-free record.
    try {
      const localValue = localStorage.getItem(key);
      if (localValue) {
        const local = JSON.parse(localValue) as {
          header?: Record<string, string>;
          rows?: Record<string, unknown>;
          order?: string[];
        };
        const cloud = JSON.parse(value) as typeof local;
        const localRows = local.rows ?? {};
        const cloudRows = cloud.rows ?? {};
        const cloudOrder = cloud.order ?? [];
        const localOrder = local.order ?? [];
        value = JSON.stringify({
          ...cloud,
          header: { ...(cloud.header ?? {}), ...(local.header ?? {}) },
          rows: { ...cloudRows, ...localRows },
          order: [...cloudOrder, ...localOrder.filter((id) => !cloudOrder.includes(id))],
        });
      }
    } catch {
      /* malformed legacy data falls back to the valid cloud value */
    }
  }
  rawSet(key, value);
}

function syncable(key: string) {
  return key.startsWith(PREFIX) && !LOCAL_ONLY.has(key) && !key.startsWith(UNIT_BUILDER_SAVE_PROBE);
}

/** Profile id encoded in account-owned learner state. Old facilitator/device
 * copies can retain these keys after the profile has moved to its own account;
 * they must not recreate deleted duplicate cloud rows on the next sign-in. */
function ownedProfileId(key: string): string | undefined {
  const direct = key.match(
    /^itss\.(?:progress|poe|notes|noteorder|notetitles|checklist|sectiond)\.([^.]+)$/
  );
  if (direct) return direct[1];
  return key.match(/^itss\.lessonquiz\.([^.]+)\./)?.[1];
}

async function pushKey(key: string, value: string | null) {
  if (!supabase || !userId) return false;
  const owner = userId;
  const previous = pushes.get(key);
  const pushing = (async () => {
    await previous;
    await waitForPendingWrites();
    if (userId !== owner) return false;
    const pending = pendingFor(key);
    if (pending) value = pending.value;
    try {
      let result;
      if (isShared(key)) {
        if (value === null) {
          result = await supabase.from("shared_state").delete().eq("tenant_id", TENANT_ID).eq("key", key);
        } else {
          result = await supabase
            .from("shared_state")
            .upsert({ tenant_id: TENANT_ID, key, value, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,key" });
        }
      } else if (value === null) {
        result = await supabase.from("app_state").delete().eq("user_id", owner).eq("key", key);
      } else {
        result = await supabase
          .from("app_state")
          .upsert(
            { user_id: owner, tenant_id: TENANT_ID, key, value, updated_at: new Date().toISOString() },
            { onConflict: "user_id,key" }
          );
      }
      if (result.error) {
        pushErrors.set(key, result.error.message || "The database rejected the save.");
        return false;
      }
      if (pending) await forgetPendingWrite(pending);
      pushErrors.delete(key);
      return true;
    } catch (error) {
      pushErrors.set(key, error instanceof Error ? error.message : "The cloud request failed.");
      // Keep the durable pending write for the next connection or reload.
      return false;
    }
  })();
  pushes.set(key, pushing);
  const saved = await pushing;
  if (pushes.get(key) === pushing) pushes.delete(key);
  return saved;
}

function queue(key: string, value: string | null) {
  if (hydrating) return;
  const persisted = rememberPending(key, value);
  void persisted.catch(error => console.error("Could not persist pending cloud save:", error));
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      void persisted.then(() => pushKey(key, value)).catch(error =>
        console.error("Could not queue cloud save:", error));
    }, 600)
  );
}

/** Immediately push a key's current localStorage state to the cloud,
 *  bypassing the debounce — for destructive actions (e.g. removing a
 *  profile) that must not lose the race against navigation/tab close. */
export async function flushKey(key: string, requireCloud = false): Promise<void> {
  return flushValue(key, localStorage.getItem(key), requireCloud);
}

/** Immediately push an explicit value that is stored outside localStorage. */
export async function flushValue(
  key: string,
  value: string | null,
  requireCloud = false
): Promise<void> {
  if (requireCloud && (!supabase || !userId)) {
    throw new Error("Cloud saving requires a connection and a signed-in account. Your edits have not been saved to the cloud.");
  }
  const t = timers.get(key);
  if (t) {
    clearTimeout(t);
    timers.delete(key);
  }
  if (requireCloud) {
    try {
      await rememberPending(key, value);
    } catch (error) {
      console.error("Could not persist pending cloud save:", error);
      throw new Error("This browser could not store the pending cloud save. Check browser storage permissions and available disk space, then try again.");
    }
  }
  const saved = await pushKey(key, value);
  if (requireCloud && !saved) {
    const detail = pushErrors.get(key);
    throw new Error(detail
      ? `Cloud save failed: ${detail}. Your edits are still on this device.`
      : "Cloud save failed. Check your connection and try Save to cloud again. Your edits are still on this device.");
  }
  if (requireCloud && pendingFor(key)) throw new Error("More edits were made while saving. Click Save to cloud again to save the latest changes.");
}

/** Save every edit queued for the signed-in account before an operation that
 * removes its local data (notably sign-out).  A failed push deliberately
 * rejects so the caller can keep the local copy instead of losing work. */
export async function flushPendingCloudWrites(): Promise<void> {
  if (!supabase || !userId) return;

  // Let in-flight IndexedDB writes finish before taking the queue snapshot.
  await waitForPendingWrites();
  const owner = userId;
  const keys = new Set<string>([
    ...timers.keys(),
    ...pendingWrites()
      .filter(write => write.userId === owner)
      .map(write => write.key),
  ]);

  for (const key of keys) {
    const timer = timers.get(key);
    if (timer) clearTimeout(timer);
    timers.delete(key);
    const pending = pendingWrites().find(write => write.userId === owner && write.key === key);
    const value = pending ? pending.value : localStorage.getItem(key);
    const saved = await pushKey(key, value);
    if (!saved || pendingWrites().some(write => write.userId === owner && write.key === key)) {
      const detail = pushErrors.get(key);
      throw new Error(detail
        ? `Cloud save failed: ${detail}. Your work is still on this device.`
        : "Cloud save failed. Your work is still on this device.");
    }
  }
}

/**
 * Patch localStorage so every write/removal of a syncable key is mirrored to
 * the cloud. Installed once at startup; harmless in local-only mode because
 * pushes are no-ops until a user id is set.
 */
export function installSync() {
  const remove = localStorage.removeItem.bind(localStorage);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(UNIT_BUILDER_SAVE_PROBE)) remove(key);
    }
  } catch {
    /* legacy cleanup is best effort */
  }
  localStorage.setItem = (key: string, value: string) => {
    if (key.startsWith(UNIT_BUILDER_SAVE_PROBE)) return;
    if(isLargeStateKey(key)){receiveUnitPack(key,value);if(syncable(key))queue(key,value);return;}
    rawSet(key, value);
    if (syncable(key)) queue(key, value);
  };
  localStorage.removeItem = (key: string) => {
    remove(key);
    if (syncable(key)) queue(key, null);
  };
  window.addEventListener("online", () => {
    for (const write of pendingWrites().filter(write => write.userId === userId)) {
      void pushKey(write.key, write.value);
    }
  });
}

/**
 * Hydrate localStorage from the signed-in user's cloud snapshot, then push up
 * any local keys the cloud does not have yet (first login from this device).
 * Cloud values win unless this account has an unsynced local write.
 */
export async function startSync(authUserId: string): Promise<void> {
  userId = authUserId;
  if (!supabase) return;
  try {
    await loadPendingWrites();
  } catch (error) {
    console.error("Could not load pending cloud saves; cloud hydration was skipped to protect local edits:", error);
    return;
  }
  const dirtyAtStart = new Set(pendingWrites().filter(write => write.userId === authUserId).map(write => write.key));

  const [own, shared] = await Promise.all([
    // app_state is readable across accounts (staff directory) — hydrate
    // strictly from THIS user's own rows
    supabase.from("app_state").select("key,value").eq("user_id", authUserId).eq("tenant_id", TENANT_ID),
    supabase.from("shared_state").select("key,value").eq("tenant_id", TENANT_ID),
  ]);
  if (own.error) return; // stay on local data rather than blocking the app

  hydrating = true;
  const cloudKeys = new Set<string>();
  for (const row of own.data ?? []) {
    cloudKeys.add(row.key);
    if (!LOCAL_ONLY.has(row.key) && !dirtyAtStart.has(row.key)) writeFromCloud(row.key, row.value);
  }
  for (const row of shared.error ? [] : shared.data ?? []) {
    cloudKeys.add(row.key);
    if (!LOCAL_ONLY.has(row.key) && !dirtyAtStart.has(row.key)) writeFromCloud(row.key, row.value);
  }
  hydrating = false;
  // When this account already has an authoritative cloud profile list, only
  // upload per-profile state for ids still present in that list. Without this
  // guard, a browser that once held another learner's seeded progress can
  // resurrect that duplicate row after an administrator consolidates it.
  let ownedProfileIds: Set<string> | null = null;
  if (cloudKeys.has("itss.profiles")) {
    try {
      const profiles = JSON.parse(localStorage.getItem("itss.profiles") ?? "[]") as { id?: string }[];
      ownedProfileIds = new Set(profiles.map((profile) => profile.id).filter((id): id is string => Boolean(id)));
    } catch {
      ownedProfileIds = null;
    }
  }
  const orphanedProfileState = (key: string) => {
    const profileId = ownedProfileId(key);
    return !!profileId && !!ownedProfileIds && !ownedProfileIds.has(profileId);
  };
  for (const write of pendingWrites().filter(write => write.userId === authUserId)) {
    if (orphanedProfileState(write.key)) {
      await forgetPendingWrite(write);
      continue;
    }
    await pushKey(write.key, write.value);
  }

  // push local-only data (e.g. work done before cloud sync was configured)
  for(const [key,value] of await storedUnitPacks().catch(()=>[] as [string,string][])) {
    if(!cloudKeys.has(key)) await pushKey(key,value);
  }
  if (!cloudKeys.has(ONBOARDING_KEY)) {
    const value = await storedOnboardingPacks().catch(() => null);
    if (value !== null) await pushKey(ONBOARDING_KEY, value);
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Polls must come from an explicit tenant-aware mutation, never an unowned legacy cache.
    if (key && key !== "itss.polls.shared" && syncable(key) && !cloudKeys.has(key) && !orphanedProfileState(key)) {
      const value = localStorage.getItem(key);
      if (value !== null) void pushKey(key, value);
    }
  }
}

export function stopSync() {
  userId = null;
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

/** Remove all synced app data from this browser (used on cloud sign-out). */
export function wipeLocalData() {
  clearUnitPacks();
  void clearOnboardingPacks();
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === `itssDevice.polls.${TENANT_ID}` ||
        (key && key.startsWith(PREFIX) && key !== "itss.theme" && key !== "itss.activeCourse")) doomed.push(key);
  }
  for (const key of doomed) localStorage.removeItem(key);
}

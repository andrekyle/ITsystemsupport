import { supabase } from "./supabase";
import { TENANT_ID } from "./tenant";
import { archiveCourseCopy } from "./unitStorage";

const cache = new Map<string, string>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pending = new Map<string, Promise<void>>();
const dirty = new Set<string>();
const eventName = (key: string) => `lesson-edits:${key}`;

function publish(key: string, value: string) {
  cache.set(key, value);
  window.dispatchEvent(new CustomEvent(eventName(key), { detail: value }));
}

/** Accept lesson edits received by the general cloud bootstrap without copying
 * their potentially large rich HTML into quota-limited localStorage. */
export function receiveLessonEdits(key: string, value: string): void {
  const previous = cache.get(key) ?? localStorage.getItem(key);
  if (previous && previous !== value) void archiveCourseCopy(key, previous).catch(() => {});
  publish(key, value);
}

export function hasPendingLessonEdits(key: string): boolean { return dirty.has(key); }

export function cachedLessonEdits<T>(key: string, fallback: T): T {
  try {
    const value = cache.get(key) ?? localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch { return fallback; }
}

export function subscribeLessonEdits(key: string, listener: (value: string) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail);
  window.addEventListener(eventName(key), handler);
  return () => window.removeEventListener(eventName(key), handler);
}

export async function loadLessonEdits<T>(key: string, fallback: T): Promise<T> {
  if (dirty.has(key)) return cachedLessonEdits(key, fallback);
  // One-time migration: a pre-existing browser copy may contain edits that
  // never reached Supabase because the quota exception interrupted syncing.
  const legacy = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
  if (legacy && !cache.has(key)) {
    receiveLessonEdits(key, legacy);
    if (!supabase) {
      try { return JSON.parse(legacy) as T; } catch { return fallback; }
    }
  }
  if (!supabase) return cachedLessonEdits(key, fallback);
  if (dirty.has(key)) return cachedLessonEdits(key, fallback);
  // Remember the exact local value at request time. Editing can continue while
  // the cloud read is in flight (notably when a PPT upload changes revisions).
  // A late response must never replace those newer local edits.
  const cacheAtRequest = cache.get(key);
  const { data, error } = await supabase.from("shared_state").select("value").eq("tenant_id", TENANT_ID).eq("key", key).maybeSingle();
  if (error || !data?.value) return cachedLessonEdits(key, fallback);
  const latestCache = cache.get(key);
  if (dirty.has(key)) return cachedLessonEdits(key, fallback);
  if (latestCache !== cacheAtRequest && latestCache !== undefined) {
    try { return JSON.parse(latestCache) as T; } catch { return fallback; }
  }
  receiveLessonEdits(key, data.value);
  try { return JSON.parse(data.value) as T; } catch { return fallback; }
}

async function persist(key: string, value: string): Promise<void> {
  if (!supabase) {
    // Offline/local installations retain the old fallback where capacity
    // permits. Cloud installations never depend on browser quota.
    localStorage.setItem(key, value);
    return;
  }
  const previous = pending.get(key);
  const request = (async () => {
    await previous?.catch(() => {});
    const latest = cache.get(key) ?? value;
    const { error } = await supabase.from("shared_state").upsert(
      { tenant_id: TENANT_ID, key, value: latest, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id,key" },
    );
    if (error) throw new Error(`Lesson edits could not be saved: ${error.message}`);
    if (cache.get(key) === latest) dirty.delete(key);
    // Remove a legacy oversized copy after the database has accepted it.
    try { Storage.prototype.removeItem.call(localStorage, key); } catch { /* optional cleanup */ }
  })();
  pending.set(key, request);
  try { await request; } finally { if (pending.get(key) === request) pending.delete(key); }
}

export function queueLessonEdits(key: string, value: unknown): void {
  dirty.add(key);
  const encoded = JSON.stringify(value);
  cache.set(key, encoded);
  const timer = timers.get(key);
  if (timer) clearTimeout(timer);
  timers.set(key, setTimeout(() => {
    timers.delete(key);
    void persist(key, cache.get(key) ?? encoded).catch(() => {});
  }, 500));
}

export async function flushLessonEdits(key: string, value?: unknown): Promise<void> {
  dirty.add(key);
  if (value !== undefined) publish(key, JSON.stringify(value));
  const timer = timers.get(key);
  if (timer) { clearTimeout(timer); timers.delete(key); }
  const encoded = cache.get(key);
  if (encoded === undefined) throw new Error("There are no lesson edits to save.");
  await persist(key, encoded);
}

/** Keep visible/deleted slides and rich text in step with the published unit. */
export function watchLessonEdits(key: string): () => void {
  if (!supabase) return () => {};
  let active = true;
  let running = false;
  let stamp: string | undefined;
  const refresh = async () => {
    if (!active || running || dirty.has(key) || document.visibilityState === "hidden") return;
    running = true;
    try {
      const { data, error } = await supabase!.from("shared_state").select("updated_at")
        .eq("tenant_id", TENANT_ID).eq("key", key).maybeSingle();
      if (!active || error || !data || data.updated_at === stamp || dirty.has(key)) return;
      const before = cache.get(key);
      const result = await supabase!.from("shared_state").select("value")
        .eq("tenant_id", TENANT_ID).eq("key", key).maybeSingle();
      if (!active || result.error || !result.data?.value || dirty.has(key) || cache.get(key) !== before) return;
      JSON.parse(result.data.value);
      receiveLessonEdits(key, result.data.value);
      stamp = data.updated_at;
    } catch { /* keep offline content and retry */ }
    finally { running = false; }
  };
  const timer = window.setInterval(() => void refresh(), 15_000);
  window.addEventListener("focus", refresh);
  window.addEventListener("online", refresh);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    active = false;
    window.clearInterval(timer);
    window.removeEventListener("focus", refresh);
    window.removeEventListener("online", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}

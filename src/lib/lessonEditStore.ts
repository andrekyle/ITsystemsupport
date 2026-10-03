import { supabase } from "./supabase";

const cache = new Map<string, string>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pending = new Map<string, Promise<void>>();
const eventName = (key: string) => `lesson-edits:${key}`;

function publish(key: string, value: string) {
  cache.set(key, value);
  window.dispatchEvent(new CustomEvent(eventName(key), { detail: value }));
}

/** Accept lesson edits received by the general cloud bootstrap without copying
 * their potentially large rich HTML into quota-limited localStorage. */
export function receiveLessonEdits(key: string, value: string): void {
  publish(key, value);
}

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
  // One-time migration: a pre-existing browser copy may contain edits that
  // never reached Supabase because the quota exception interrupted syncing.
  const legacy = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
  if (legacy) {
    receiveLessonEdits(key, legacy);
    if (supabase) await persist(key, legacy);
    try { return JSON.parse(legacy) as T; } catch { return fallback; }
  }
  if (!supabase) return cachedLessonEdits(key, fallback);
  const { data, error } = await supabase.from("shared_state").select("value").eq("key", key).maybeSingle();
  if (error || !data?.value) return cachedLessonEdits(key, fallback);
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
      { key, value: latest, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    if (error) throw new Error(`Lesson edits could not be saved: ${error.message}`);
    // Remove a legacy oversized copy after the database has accepted it.
    try { Storage.prototype.removeItem.call(localStorage, key); } catch { /* optional cleanup */ }
  })();
  pending.set(key, request);
  try { await request; } finally { if (pending.get(key) === request) pending.delete(key); }
}

export function queueLessonEdits(key: string, value: unknown): void {
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
  if (value !== undefined) publish(key, JSON.stringify(value));
  const timer = timers.get(key);
  if (timer) { clearTimeout(timer); timers.delete(key); }
  const encoded = cache.get(key);
  if (encoded === undefined) throw new Error("There are no lesson edits to save.");
  await persist(key, encoded);
}

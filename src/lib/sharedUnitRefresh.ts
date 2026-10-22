import { supabase } from "./supabase";
import { TENANT_ID } from "./tenant";
import { hasPendingCloudWrite } from "./sync";
import { forgetUnitPack, loadUnitPack, receiveUnitPack, unitPackSnapshot } from "./unitStorage";

/** Watch the published row, including saves that keep the same build revision. */
const watchers = new Map<string, { users: number; stop: () => void }>();
export function watchSharedUnit(key: string): () => void {
  if (!supabase) return () => {};
  let watcher = watchers.get(key);
  if (!watcher) {
    let alive = true;
    let running = false;
    let lastUpdated: string | undefined;
    let lastValue: string | null | undefined;
    const refresh = async () => {
      if (!alive || running || document.visibilityState === "hidden" || hasPendingCloudWrite(key)) return;
      running = true;
      try {
        await loadUnitPack(key).catch(() => {});
        const before = unitPackSnapshot(key);
        // Poll only the timestamp; course packs can contain large embedded files.
        const { data: stamp, error: stampError } = await supabase!.from("shared_state")
          .select("updated_at").eq("tenant_id", TENANT_ID).eq("key", key).maybeSingle();
        if (!alive || stampError || hasPendingCloudWrite(key) || unitPackSnapshot(key) !== before) return;
        if (!stamp) {
          // A missing row on first connection may be an unpublished local build.
          if (lastValue != null && before !== null) forgetUnitPack(key);
          lastUpdated = undefined;
          lastValue = null;
          return;
        }
        if (stamp.updated_at === lastUpdated && before === lastValue) return;
        const { data, error } = await supabase!.from("shared_state")
          .select("value,updated_at").eq("tenant_id", TENANT_ID).eq("key", key).maybeSingle();
        if (!alive || error || !data || hasPendingCloudWrite(key) || unitPackSnapshot(key) !== before) return;
        // An unreadable pack must not replace a usable offline copy.
        const pack = JSON.parse(data.value);
        if (!pack?.revision || !pack?.files || !Array.isArray(pack?.content?.lesson)) return;
        lastUpdated = data.updated_at;
        lastValue = data.value;
        if (before !== data.value) receiveUnitPack(key, data.value);
      } catch {
        // Retain offline material and retry on focus, reconnect, or the next poll.
      } finally { running = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    watcher = { users: 0, stop: () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    } };
    watchers.set(key, watcher);
  }
  watcher.users++;
  return () => {
    if (--watcher.users === 0) {
      watcher.stop();
      watchers.delete(key);
    }
  };
}

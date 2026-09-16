import { useMemo, useSyncExternalStore } from "react";
import { builtUnitKey, readBuiltUnit, type BuiltUnit, type BuiltUnitVersion } from "./builtUnits";
import { supabase } from "./supabase";
import { writeFromCloud } from "./sync";

const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener("unit-built", listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener("unit-built", listener); };
};
export function useBuiltUnit(us: string) {
  const snapshot = useSyncExternalStore(subscribe, () => localStorage.getItem(builtUnitKey(us)), () => null);
  return useMemo(() => snapshot ? readBuiltUnit(us) : undefined, [snapshot, us]);
}
export async function saveBuiltUnit(us: string, next: BuiltUnitVersion): Promise<void> {
  const old = readBuiltUnit(us);
  const payload: BuiltUnit = { ...next, previous: old ? { revision: old.revision, source: old.source, content: old.content, files: old.files, createdAt: old.createdAt, aiUsed: old.aiUsed } : undefined };
  const key = builtUnitKey(us);
  const value = JSON.stringify(payload);
  // Detect a full browser store before attempting a shared save.
  const probe = `unitbuilder-save-probe.${us}`;
  localStorage.setItem(probe, value); localStorage.removeItem(probe);
  if (supabase) {
    const { error } = await supabase.from("shared_state").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(`The unit could not be saved to the shared course: ${error.message}`);
    writeFromCloud(key, value);
  } else localStorage.setItem(key, value);
  window.dispatchEvent(new Event("unit-built"));
}

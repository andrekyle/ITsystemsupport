import { useMemo, useSyncExternalStore } from "react";
import { builtUnitKey, readBuiltUnit, unitPackValue, type BuiltUnitVersion } from "./builtUnits";
import { supabase } from "./supabase";
import { loadUnitPack, persistUnitPack, rememberUnitPack, unitPackSnapshot } from "./unitStorage";

const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener("unit-built", listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener("unit-built", listener); };
};
export function useBuiltUnit(us: string) {
  const snapshot = useSyncExternalStore(subscribe, () => unitPackSnapshot(builtUnitKey(us)), () => null);
  return useMemo(() => snapshot ? readBuiltUnit(us) : undefined, [snapshot, us]);
}
export async function saveBuiltUnit(us: string, next: BuiltUnitVersion): Promise<void> {
  await loadUnitPack(builtUnitKey(us)).catch(()=>{});
  const key = builtUnitKey(us);
  const value = unitPackValue(readBuiltUnit(us), next);
  if (supabase) {
    const { error } = await supabase.from("shared_state").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(`The unit could not be saved to the shared course: ${error.message}`);
    // A full local cache must not turn a successful shared save into an error.
    await persistUnitPack(key,value).catch(()=>{});
  } else {
    try { await persistUnitPack(key,value); }
    catch { throw new Error("The unit could not be saved on this device. Browser storage is unavailable or full. Your previous unit is unchanged."); }
  }
  rememberUnitPack(key,value);
  // Remove only this migrated copy; never clear other app data or queue a cloud deletion.
  try {
    Storage.prototype.removeItem.call(localStorage,key);
    Storage.prototype.removeItem.call(localStorage,`unitbuilder-save-probe.${us}`);
  } catch { /* The pack is already saved; optional cleanup cannot undo it. */ }
}

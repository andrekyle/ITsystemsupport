import { useEffect, useMemo, useSyncExternalStore } from "react";
import { builtUnitKey, readBuiltUnit, unitPackValue, type BuiltUnitVersion } from "./builtUnits";
import { supabase } from "./supabase";
import { forgetUnitPack, loadUnitPack, persistUnitPack, rememberUnitPack, unitPackSnapshot } from "./unitStorage";
import { TENANT_ID } from "./tenant";
import { watchSharedUnit } from "./sharedUnitRefresh";

const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener("unit-built", listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener("unit-built", listener); };
};
export function useBuiltUnit(us: string) {
  const key = builtUnitKey(us);
  const snapshot = useSyncExternalStore(subscribe, () => unitPackSnapshot(key), () => null);
  useEffect(() => watchSharedUnit(key), [key]);
  return useMemo(() => snapshot ? readBuiltUnit(us) : undefined, [snapshot, us]);
}
export async function saveBuiltUnit(us: string, next: BuiltUnitVersion): Promise<void> {
  await loadUnitPack(builtUnitKey(us)).catch(()=>{});
  const key = builtUnitKey(us);
  const value = unitPackValue(readBuiltUnit(us), next);
  if (supabase) {
    const { error } = await supabase.from("shared_state").upsert({ tenant_id: TENANT_ID, key, value, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,key" });
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

export async function deleteBuiltUnit(us: string): Promise<void> {
  const key = builtUnitKey(us);
  if (supabase) {
    const { error } = await supabase.from("shared_state").delete().eq("tenant_id", TENANT_ID).eq("key", key);
    if (error) throw new Error(`The unit could not be deleted from the shared course: ${error.message}`);
  }
  forgetUnitPack(key);
  // Delete from localStorage
  try {
    Storage.prototype.removeItem.call(localStorage, key);
    Storage.prototype.removeItem.call(localStorage, `unitbuilder-save-probe.${us}`);
  } catch { /* optional cleanup */ }
}

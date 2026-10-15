import { useMemo, useSyncExternalStore } from "react";
import { builtUnitKey, deletedBuiltUnitKey, readBuiltUnit, unitPackValue, type BuiltUnit, type BuiltUnitVersion } from "./builtUnits";
import { supabase } from "./supabase";
import { forgetUnitPack, loadUnitPack, persistUnitPack, rememberUnitPack, unitPackSnapshot } from "./unitStorage";
import { courseScopedUnit } from "./courseScope";
import { TENANT_ID } from "./tenant";

const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener("unit-built", listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener("unit-built", listener); };
};
export function useBuiltUnit(us: string) {
  const snapshot = useSyncExternalStore(subscribe, () => unitPackSnapshot(builtUnitKey(us)), () => null);
  return useMemo(() => snapshot ? readBuiltUnit(us) : undefined, [snapshot, us]);
}
function readDeletedBuiltUnit(us:string):BuiltUnit|undefined{
  try{
    const data=JSON.parse(unitPackSnapshot(deletedBuiltUnitKey(us))??"null") as BuiltUnit|null;
    return data?.content?.lesson&&data?.revision&&data?.files?data:undefined;
  }catch{return undefined;}
}
export function useDeletedBuiltUnit(us:string){
  const snapshot=useSyncExternalStore(subscribe,()=>unitPackSnapshot(deletedBuiltUnitKey(us)),()=>null);
  return useMemo(()=>snapshot?readDeletedBuiltUnit(us):undefined,[snapshot,us]);
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
  await loadUnitPack(key).catch(()=>{});
  const current=readBuiltUnit(us);
  if(!current)throw new Error("This unit build is no longer available to back up.");
  const backupKey=deletedBuiltUnitKey(us);
  const backupValue=JSON.stringify(current);
  if (supabase) {
    const { error: backupError } = await supabase.from("shared_state").upsert({ tenant_id: TENANT_ID, key: backupKey, value: backupValue, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,key" });
    if (backupError) throw new Error(`The safety backup could not be created: ${backupError.message}`);
    const { error } = await supabase.from("shared_state").delete().eq("tenant_id", TENANT_ID).eq("key", key);
    if (error) throw new Error(`The unit could not be deleted from the shared course: ${error.message}`);
    await persistUnitPack(backupKey,backupValue).catch(()=>{});
  } else {
    await persistUnitPack(backupKey,backupValue);
  }
  // Delete from IndexedDB
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("itss-unit-packs", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction("packs", "readwrite");
    tx.objectStore("packs").delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  // Delete from localStorage
  try {
    Storage.prototype.removeItem.call(localStorage, key);
    Storage.prototype.removeItem.call(localStorage, `unitbuilder-save-probe.${us}`);
  } catch { /* optional cleanup */ }
  // Notify listeners
  forgetUnitPack(key);
}

export async function restoreDeletedBuiltUnit(us:string):Promise<void>{
  const backupKey=deletedBuiltUnitKey(us);
  await loadUnitPack(backupKey).catch(()=>{});
  const backup=readDeletedBuiltUnit(us);
  if(!backup)throw new Error("No deleted-build backup is available for this unit.");
  await saveBuiltUnit(us,{...backup,revision:crypto.randomUUID(),createdAt:new Date().toISOString()});
  if(supabase){
    const {error}=await supabase.from("shared_state").delete().eq("tenant_id",TENANT_ID).eq("key",backupKey);
    if(error)throw new Error(`The build was restored, but its backup marker could not be cleared: ${error.message}`);
  }
  const database=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open("itss-unit-packs",1);request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result);});
  await new Promise<void>((resolve,reject)=>{const tx=database.transaction("packs","readwrite");tx.objectStore("packs").delete(backupKey);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
  forgetUnitPack(backupKey);
}

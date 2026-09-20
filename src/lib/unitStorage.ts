/** Large generated packs belong in IndexedDB, not the small localStorage quota. */
const cache = new Map<string, string>();
const pending = new Set<string>();
const loads = new Map<string, Promise<void>>();
let generation=0;
export const isUnitPackKey = (key:string) => /^itss\.unitbuilder\.(?:custom-[^.]+\.)?[^.]+\.shared$/.test(key);
let database: Promise<IDBDatabase> | undefined;
function db() {
  return database ??= new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open("itss-unit-packs",1);
    request.onupgradeneeded=()=>request.result.createObjectStore("packs");
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>{database=undefined;reject(request.error);};
  });
}
function notify(){ window.dispatchEvent(new Event("unit-built")); }
export function rememberUnitPack(key:string,value:string){cache.set(key,value);notify();}
export async function persistUnitPack(key:string,value:string){
  const database=await db();
  await new Promise<void>((resolve,reject)=>{
    const tx=database.transaction("packs","readwrite");
    tx.objectStore("packs").put(value,key);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
  // Bypass sync's removeItem wrapper: migration is not a shared deletion.
  try { Storage.prototype.removeItem.call(localStorage,key); } catch { /* cache cleanup is best effort */ }
}
export async function loadUnitPack(key:string):Promise<void> {
  if(cache.has(key))return;
  const existing=loads.get(key);
  if(existing)return existing;
  const started=generation;
  const loading=db().then(database=>new Promise<void>((resolve,reject)=>{
    const request=database.transaction("packs").objectStore("packs").get(key);
    request.onsuccess=()=>{if(started===generation&&typeof request.result==="string"&&!cache.has(key))rememberUnitPack(key,request.result);resolve();};
    request.onerror=()=>reject(request.error);
  })).finally(()=>{if(loads.get(key)===loading)loads.delete(key);});
  loads.set(key,loading);
  return loading;
}
export function unitPackSnapshot(key:string):string|null {
  if(cache.has(key))return cache.get(key)!;
  const legacy=localStorage.getItem(key);
  if(legacy) return legacy;
  if(!pending.has(key)){
    pending.add(key);
    void loadUnitPack(key).catch(()=>{pending.delete(key);});
  }
  return null;
}
/** Cloud is already durable; cache it without letting local quota break sync. */
export function receiveUnitPack(key:string,value:string){
  rememberUnitPack(key,value);
  void persistUnitPack(key,value).catch(()=>{});
}
export async function storedUnitPacks():Promise<[string,string][]> {
  const database=await db();
  return new Promise((resolve,reject)=>{
    const rows:[string,string][]=[];
    const request=database.transaction("packs").objectStore("packs").openCursor();
    request.onsuccess=()=>{const c=request.result;if(c){rows.push([String(c.key),c.value]);c.continue();}else resolve(rows);};
    request.onerror=()=>reject(request.error);
  });
}
export function clearUnitPacks(){
  generation++;cache.clear();pending.clear();loads.clear();
  void db().then(database=>{database.transaction("packs","readwrite").objectStore("packs").clear();}).catch(()=>{});
  notify();
}

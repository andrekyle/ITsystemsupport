import type { OnboardingPack } from "../store";

export const ONBOARDING_KEY = "itss.onboarding.shared";

const DATABASE_NAME = "itss-onboarding";
const STORE_NAME = "packs";
let database: Promise<IDBDatabase> | undefined;

function db() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
  }));
}

function notify() {
  window.dispatchEvent(new Event("onboarding-packs-updated"));
}

function normalize(packs: OnboardingPack[]) {
  return packs.map((pack) => ({ ...pack, files: pack.files ?? [] }));
}

function legacyPacks(): OnboardingPack[] | null {
  try {
    const value = localStorage.getItem(ONBOARDING_KEY);
    if (value === null) return null;
    const parsed = JSON.parse(value) as OnboardingPack[];
    return Array.isArray(parsed) ? normalize(parsed) : null;
  } catch {
    return null;
  }
}

function removeLegacyCopy() {
  try {
    Storage.prototype.removeItem.call(localStorage, ONBOARDING_KEY);
  } catch {
    /* legacy cleanup is best effort */
  }
}

async function storePacks(packs: OnboardingPack[]) {
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(packs, ONBOARDING_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function readPacks(
  fallback: OnboardingPack[],
  throwOnDatabaseError: boolean
): Promise<OnboardingPack[]> {
  const legacy = legacyPacks();
  try {
    const database = await db();
    const value = await new Promise<OnboardingPack[] | undefined>((resolve, reject) => {
      const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(ONBOARDING_KEY);
      request.onsuccess = () => resolve(request.result as OnboardingPack[] | undefined);
      request.onerror = () => reject(request.error);
    });
    if (value !== undefined) return normalize(value);

    // Move the old inline file data out of localStorage as soon as it is read,
    // rather than waiting for the user to edit a pack before freeing the quota.
    if (legacy !== null) {
      await storePacks(legacy);
      removeLegacyCopy();
      return legacy;
    }
  } catch (error) {
    if (throwOnDatabaseError) throw error;
    /* localStorage remains the legacy fallback if IndexedDB is unavailable */
  }

  return legacy ?? normalize(fallback);
}

export function loadOnboardingPacks(fallback: OnboardingPack[] = []): Promise<OnboardingPack[]> {
  return readPacks(fallback, false);
}

export function loadOnboardingPacksForUpdate(
  fallback: OnboardingPack[] = []
): Promise<OnboardingPack[]> {
  return readPacks(fallback, true);
}

export async function persistOnboardingPacks(packs: OnboardingPack[]) {
  await storePacks(normalize(packs));
  removeLegacyCopy();
  notify();
}

export function receiveOnboardingPacks(value: string) {
  try {
    const packs = JSON.parse(value) as OnboardingPack[];
    if (!Array.isArray(packs)) return;
    void persistOnboardingPacks(packs).catch(() => {});
  } catch {
    /* malformed cloud data is ignored by the existing sync fallback */
  }
}

export async function storedOnboardingPacks(): Promise<string | null> {
  const packs = await loadOnboardingPacks();
  return packs.length ? JSON.stringify(packs) : null;
}

export async function clearOnboardingPacks() {
  try {
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(ONBOARDING_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    /* sign-out cleanup remains best effort if browser storage is unavailable */
  } finally {
    notify();
  }
}

type Sync = typeof import("../src/lib/sync");
type PendingWrite = import("../src/lib/syncPendingStorage").PendingWrite;
const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
async function rejects(action: Promise<void>, pattern: RegExp) {
  try { await action; } catch (error) {
    assert(pattern.test(String(error)), `Unexpected error: ${error}`);
    return;
  }
  throw new Error(`Expected rejection matching ${pattern}`);
}

const key = "itss.regression.shared";
const cloud = new Map([[key, "old text"]]);
let failure = false;
let beforeSave: (() => void) | undefined;
Object.assign(globalThis, { testCloud: { from(table: string) {
  return {
    select() {
      const result = Promise.resolve({ data: table === "shared_state"
        ? [...cloud].map(([key, value]) => ({ key, value })) : [], error: null });
      return Object.assign(result, { eq: () => result });
    },
    async upsert(row: { key: string; value: string }) {
      if (failure) return { error: { message: "Offline" } };
      beforeSave?.();
      beforeSave = undefined;
      cloud.set(row.key, row.value);
      return { error: null };
    },
    delete() { return { async eq(_column: string, key: string) {
      if (failure) return { error: { message: "Offline" } };
      cloud.delete(key);
      return { error: null };
    } }; },
  };
} } });

async function stored(): Promise<PendingWrite[]> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("itss-sync-pending", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<PendingWrite[]>((resolve, reject) => {
      const request = database.transaction("writes").objectStore("writes").getAll();
      request.onsuccess = () => resolve(request.result as PendingWrite[]);
      request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}

async function waitStored(value: string | null) {
  for (let i = 0; i < 100; i++) {
    if ((await stored()).some(write => write.key === key && write.value === value)) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error("Pending write was not durably stored");
}

let sequence = 0;
async function boot(user = "user-a"): Promise<Sync> {
  // A new module instance reconstructs the queue from real IndexedDB, not memory.
  localStorage.setItem = Storage.prototype.setItem.bind(localStorage);
  localStorage.removeItem = Storage.prototype.removeItem.bind(localStorage);
  const moduleUrl = `./sync.mjs?boot=${sequence++}`;
  const sync: Sync = await import(moduleUrl);
  sync.installSync();
  await sync.startSync(user);
  return sync;
}

async function test() {
  let sync = await boot();
  localStorage.setItem(key, "new text before debounce");
  await waitStored("new text before debounce");
  sync.stopSync();
  sync = await boot();
  assert(localStorage.getItem(key) === "new text before debounce", "Reload overwrote pending edits");
  assert(cloud.get(key) === "new text before debounce", "Reload did not retry pending edits");

  failure = true;
  localStorage.setItem(key, "offline text");
  await rejects(sync.flushKey(key, true), /Cloud save failed/);
  sync.stopSync();
  sync = await boot();
  assert(localStorage.getItem(key) === "offline text", "API failure lost local edits");
  sync.writeFromCloud(key, "stale background refresh");
  assert(localStorage.getItem(key) === "offline text", "Stale refresh replaced pending edits");
  failure = false;
  await sync.startSync("user-a");
  assert(cloud.get(key) === "offline text", "Retry did not save pending edits");
  assert((await stored()).length === 0, "Successful writes did not clear the queue");
  assert(localStorage.getItem("itss.syncPending") === null, "Queue payload remained in localStorage");

  beforeSave = () => localStorage.setItem(key, "newer revision");
  await rejects(sync.flushValue(key, "older revision", true), /More edits/);
  assert((await stored()).some(write => write.value === "newer revision"), "Older success removed a newer revision");
  await sync.flushKey(key, true);
  assert(cloud.get(key) === "newer revision", "Latest revision did not reach the cloud");

  failure = true;
  localStorage.removeItem(key);
  await waitStored(null);
  sync.stopSync();
  sync = await boot();
  assert(localStorage.getItem(key) === null, "Reload restored an unsynced deletion");
  failure = false;
  await sync.startSync("user-a");
  assert(!cloud.has(key), "Deleted values were not retried");

  // Inline file payloads can exceed localStorage's entire quota.
  const large = JSON.stringify([{ id: "pack", files: [{ name: "large.pdf",
    data: `data:application/pdf;base64,${"A".repeat(8 * 1024 * 1024)}` }] }]);
  const onboardingKey = "itss.onboarding.shared";
  failure = true;
  await rejects(sync.flushValue(onboardingKey, large, true), /Cloud save failed/);
  assert((await stored()).some(write => write.value === large), "Oversized payload was not durably saved");
  sync.stopSync();
  sync = await boot("user-b");
  assert(!cloud.has(onboardingKey), "Another account uploaded private pending writes");
  failure = false;
  sync.stopSync();
  sync = await boot();
  assert(cloud.get(onboardingKey) === large, "Oversized upload was not retried after reload");
  assert((await stored()).length === 0, "Oversized retry did not clear the queue");

  let filled = 0;
  try {
    for (; filled < 100; filled++) {
      Storage.prototype.setItem.call(localStorage, `quota-fill-${filled}`, "x".repeat(256 * 1024));
    }
  } catch (error) {
    assert(error instanceof DOMException && error.name === "QuotaExceededError", "Unexpected quota error");
  }
  assert(filled < 100, "Test did not fill localStorage");
  await sync.flushValue(onboardingKey, large, true);
  assert(cloud.get(onboardingKey) === large, "Full localStorage prevented a cloud upload");
  for (let i = 0; i < filled; i++) Storage.prototype.removeItem.call(localStorage, `quota-fill-${i}`);
  sync.stopSync();

  const legacy = [{ userId: "user-a", key, value: "legacy pending", revision: "legacy-revision" }];
  Storage.prototype.setItem.call(localStorage, "itss.syncPending", JSON.stringify(legacy));
  const originalOpen = indexedDB.open;
  indexedDB.open = () => { throw new DOMException("Storage blocked", "SecurityError"); };
  try {
    sync = await boot();
    await rejects(sync.flushValue(key, "blocked save", true), /could not store the pending cloud save/);
    assert(localStorage.getItem("itss.syncPending") !== null, "Failed migration discarded legacy saves");
    sync.stopSync();
  } finally { indexedDB.open = originalOpen; }
  failure = true;
  sync = await boot();
  assert(localStorage.getItem("itss.syncPending") === null, "Legacy queue was not migrated");
  assert((await stored()).some(write => write.value === "legacy pending"), "Migration lost the pending payload");
  failure = false;
  await sync.startSync("user-a");
  assert(cloud.get(key) === "legacy pending", "Migrated write was not retried");
  sync.stopSync();
  await rejects(sync.flushKey(key, true), /signed-in account/);
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent =
    "PASS: reload, API failure, stale refresh, retry, revisions, deletion, oversized uploads, account isolation, full localStorage, blocked storage, legacy migration, signed-out rejection";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});

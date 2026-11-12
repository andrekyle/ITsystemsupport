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
type AppRow = { key: string; value: string; updated_at: string; user_id: string; tenant_id: string };
const appCloud = new Map<string, AppRow>();
let failure = false;
let beforeSave: (() => void) | undefined;
let beforeProgressSave: (() => void) | undefined;
Object.assign(globalThis, { testCloud: { from(table: string) {
  if (table === "app_state") {
    const filters = new Map<string, string>();
    let operation = "read";
    let payload: Partial<AppRow> = {};
    function execute(single = false) {
      if (operation !== "read" && failure) return { data: null, error: { message: "Offline" } };
      if (operation === "update" || operation === "insert") beforeProgressSave?.();
      const rows = [...appCloud.values()].filter(row =>
        [...filters].every(([column, value]) => row[column as keyof AppRow] === value));
      if (operation === "update") {
        rows.forEach(row => appCloud.set(row.key, { ...row, ...payload }));
      } else if (operation === "insert") {
        const row = payload as AppRow;
        if (appCloud.has(row.key)) return { data: null, error: { message: "Duplicate", code: "23505" } };
        appCloud.set(row.key, row);
        rows.push(row);
      }
      return { data: single ? rows[0] ?? null : rows, error: null };
    }
    const query = {
      select() { return query; },
      eq(column: string, value: string) { filters.set(column, value); return query; },
      update(row: Partial<AppRow>) { operation = "update"; payload = row; return query; },
      insert(row: AppRow) { operation = "insert"; payload = row; return query; },
      maybeSingle() { return Promise.resolve(execute(true)); },
      then(resolve: (value: ReturnType<typeof execute>) => void) { return Promise.resolve(execute()).then(resolve); },
    };
    return query;
  }
  return {
    select() {
      const result = Promise.resolve({ data: [...cloud].map(([key, value]) => ({ key, value })), error: null });
      return Object.assign(result, { eq: () => result });
    },
    async upsert(row: { key: string; value: string }) {
      if (failure) return { error: { message: "Offline" } };
      beforeSave?.();
      beforeSave = undefined;
      cloud.set(row.key, row.value);
      return { error: null };
    },
    delete() { return { eq(column: string, key: string) {
      if (column !== "key") return this;
      if (failure) return Promise.resolve({ error: { message: "Offline" } });
      cloud.delete(key);
      return Promise.resolve({ error: null });
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

async function packs(): Promise<[string, string][]> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("itss-unit-packs", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = database.transaction("packs");
      const store = tx.objectStore("packs");
      const keys = store.getAllKeys();
      const values = store.getAll();
      tx.oncomplete = () => resolve(keys.result.map((key, index) => [String(key), values.result[index]]));
      tx.onerror = () => reject(tx.error);
    });
  } finally { database.close(); }
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

  const progressKey = "itss.progress.sync-progress-test";
  const initialProgress = JSON.stringify({ units: {
    "114076": { activities: { "Lesson & Training Aids": true }, logbook: { answer: "Original written work", unchanged: "Original shared answer", "slidegate.0": true } },
    "114074": { activities: {}, logbook: { answer: "Keep another unit" } },
  } });
  localStorage.setItem(progressKey, initialProgress);
  await sync.flushValue(progressKey, initialProgress, true);
  assert(appCloud.has(progressKey), "New progress must be inserted into the cloud");
  await sync.writeFromCloud(progressKey, JSON.stringify({ units: {
    "114076": { activities: {}, logbook: { answer: "" } },
  } }));
  let durable = (await packs()).find(([key]) => key === progressKey)?.[1];
  assert(durable?.includes("Original written work") && durable.includes("Keep another unit"), "Incomplete cloud data must not hide answers or other units");
  const snapshots = (await packs()).filter(([key]) => key.startsWith("itssDevice.courseRecovery."))
    .map(([, value]) => JSON.parse(value) as { key: string; value: string });
  assert(snapshots.some(row => row.key === progressKey && row.value === initialProgress), "Cloud reconciliation must keep an exact durable recovery copy");

  failure = true;
  const offlineSnapshot = JSON.parse(initialProgress);
  offlineSnapshot.units["114076"].logbook.answer = "Offline learner edit";
  const offlineProgress = JSON.stringify(offlineSnapshot);
  localStorage.setItem(progressKey, offlineProgress);
  await rejects(sync.flushValue(progressKey, offlineProgress, true), /Cloud save failed/);
  appCloud.set(progressKey, { ...appCloud.get(progressKey)!, value: JSON.stringify({ units: {
    "114076": { activities: { "Lesson & Training Aids": true }, logbook: { answer: "Older cloud answer", unchanged: "Updated on another device", cloudOnly: "Work saved on another device" } },
    "114074": { activities: {}, logbook: { answer: "Keep another unit" } },
  } }), updated_at: new Date().toISOString() });
  sync.stopSync();
  failure = false;
  sync = await boot();
  let remoteProgress = appCloud.get(progressKey)!.value;
  assert(remoteProgress.includes("Offline learner edit") && remoteProgress.includes("Work saved on another device") &&
    remoteProgress.includes("Keep another unit"), "Offline retries must merge, not erase cloud-only work");
  assert(remoteProgress.includes("Updated on another device"), "An offline full snapshot must not overwrite remote changes to an unedited answer");

  const editedSnapshot = JSON.parse(remoteProgress);
  editedSnapshot.units["114076"].activities["Lesson & Training Aids"] = false;
  editedSnapshot.units["114076"].logbook.answer = "";
  const editedProgress = JSON.stringify(editedSnapshot);
  let collision = false;
  beforeProgressSave = () => {
    if (collision) return;
    collision = true;
    const current = appCloud.get(progressKey)!;
    const value = JSON.parse(current.value);
    value.units["114076"].logbook.concurrent = "Concurrent device work";
    value.units["114076"].logbook.unchanged = "New edit during save";
    appCloud.set(progressKey, { ...current, value: JSON.stringify(value), updated_at: "2030-01-01T00:00:00.000Z" });
  };
  localStorage.setItem(progressKey, editedProgress);
  await sync.flushValue(progressKey, editedProgress, true);
  beforeProgressSave = undefined;
  remoteProgress = appCloud.get(progressKey)!.value;
  const latest = JSON.parse(remoteProgress);
  assert(collision && latest.units["114076"].logbook.concurrent === "Concurrent device work", "A compare-and-swap collision must retry without erasing the other device");
  assert(latest.units["114076"].logbook.unchanged === "New edit during save", "CAS retries must not overwrite remote edits using unmodified fields from a stale full snapshot");
  assert(latest.units["114076"].logbook.answer === "" &&
    latest.units["114076"].activities["Lesson & Training Aids"] === false, "Intentional clears and manual activity changes must still save");
  assert(latest.units["114074"].logbook.answer === "Keep another unit", "Saving a partial snapshot must retain other units");

  let editedDuringSave = false;
  beforeProgressSave = () => {
    if (editedDuringSave) return;
    editedDuringSave = true;
    const updated = JSON.parse(remoteProgress);
    updated.units["114076"].logbook.answer = "Typed while the progress upload was running";
    localStorage.setItem(progressKey, JSON.stringify(updated));
  };
  await rejects(sync.flushValue(progressKey, remoteProgress, true), /More edits/);
  beforeProgressSave = undefined;
  const pendingEdit = (await stored()).find(write => write.key === progressKey);
  assert(pendingEdit?.value?.includes("Typed while the progress upload was running"), "An older progress upload must not clear a newer queued answer");
  await sync.flushValue(progressKey, pendingEdit!.value, true);
  remoteProgress = appCloud.get(progressKey)!.value;
  assert(remoteProgress.includes("Typed while the progress upload was running"), "The latest typing must reach the cloud on retry");

  let revision = 0;
  beforeProgressSave = () => {
    const current = appCloud.get(progressKey)!;
    appCloud.set(progressKey, { ...current, updated_at: `2031-01-01T00:00:0${revision++}.000Z` });
  };
  await rejects(sync.flushValue(progressKey, remoteProgress, true), /changed on another device/);
  assert((await stored()).some(write => write.key === progressKey), "Exhausted conflict retries must leave a durable pending save");
  beforeProgressSave = undefined;
  await sync.flushValue(progressKey, remoteProgress, true);

  const beforeMalformed = (await packs()).find(([key]) => key === progressKey)?.[1];
  await rejects(Promise.resolve(sync.writeFromCloud(progressKey, "invalid cloud progress")), /JSON|Unexpected/);
  durable = (await packs()).find(([key]) => key === progressKey)?.[1];
  assert(durable === beforeMalformed, "Malformed cloud data must not replace valid progress");
  sync.stopSync();
  sync = await boot();
  assert((await packs()).some(([key, value]) => key === progressKey && value.includes("Keep another unit")), "Reconciled work survives a fresh module and IndexedDB hydration");

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("itss-unit-packs", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction("packs", "readwrite");
      tx.objectStore("packs").put(JSON.stringify({
        key: "itss.progress.unrelated-profile", value: "Another learner's private work",
      }), "itssDevice.courseRecovery.unrelated-test");
      tx.oncomplete = () => { database.close(); resolve(); };
      tx.onerror = () => { database.close(); reject(tx.error); };
    };
  });
  let exportBlob: Blob | undefined;
  const createObjectURL = URL.createObjectURL;
  const click = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = value => {
    if (value instanceof Blob) exportBlob = value;
    return "blob:recovery-export-test";
  };
  HTMLAnchorElement.prototype.click = () => {};
  try {
    const script = document.createElement("script");
    script.src = "recovery-export.js";
    document.body.append(script);
    for (let i = 0; i < 100 && !exportBlob; i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert(exportBlob, "Recovery snippet must finish its read-only export");
    const exported = JSON.parse(await exportBlob!.text()) as {
      indexedDB: { records: { key: string; value: string }[] }[];
      errors: string[];
    };
    assert(exported.errors.length === 0, "Recovery export must report no storage errors");
    const exportedCopies = exported.indexedDB.flatMap(database => database.records)
      .filter(row => row.key.startsWith("itssDevice.courseRecovery."))
      .map(row => JSON.parse(row.value) as { key: string; value: string });
    assert(exportedCopies.some(row => row.key === progressKey && row.value === initialProgress), "Existing recovery export must include exact learner progress backups");
    assert(exportedCopies.every(row => row.key === progressKey), "Recovery export must not include unrelated learners' backups");
  } finally {
    URL.createObjectURL = createObjectURL;
    HTMLAnchorElement.prototype.click = click;
  }
  sync.stopSync();
  await rejects(sync.flushKey(key, true), /signed-in account/);
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent =
    "PASS: offline/reload sync, account isolation, quota, field baselines, exact backups, concurrent-device/typing conflicts, intentional clears, malformed data, IndexedDB hydration and private recovery export";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});

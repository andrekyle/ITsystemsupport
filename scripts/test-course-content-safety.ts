import { startSync, writeFromCloud } from "../src/lib/sync";
import { cachedLessonEdits, flushLessonEdits, loadLessonEdits, queueLessonEdits, subscribeLessonEdits, watchLessonEdits } from "../src/lib/lessonEditStore";
import { clearUnitPacks, persistUnitPack, rememberUnitPack, storedUnitPacks, unitPackSnapshot } from "../src/lib/unitStorage";

const tick = (ms = 70) => new Promise(resolve => setTimeout(resolve, ms));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
const packKey = "itss.unitbuilder.114074.shared";
const editsKey = "itss.lessonedits.114074.built-fixture";
const pack = (count: number) => JSON.stringify({ revision: "fixture", files: {}, content: { lesson: Array.from({ length: count }, (_, i) => ({ heading: `Slide ${i + 1}` })) } });
const cloud = new Map<string, { value: string; updated_at: string }>();
let upserts = 0;
let rejectSaves = false;
Object.assign(globalThis, { contentCloud: { from(table: string) {
  const filters: Record<string, string> = {};
  let columns = "";
  const rows = () => table === "shared_state" ? [...cloud].map(([key, row]) => ({ key, ...row })) : [];
  const query = {
    select(next: string) { columns = next; return query; },
    eq(field: string, value: string) { filters[field] = value; return query; },
    then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
      return Promise.resolve({ data: rows(), error: null }).then(resolve, reject);
    },
    async maybeSingle() {
      assert(filters.tenant_id === "investec", "Course reads stay tenant scoped");
      const row = cloud.get(filters.key);
      return { data: row ? (columns === "updated_at" ? { updated_at: row.updated_at } : row) : null, error: null };
    },
    async upsert(row: { key: string; value: string; updated_at: string }) {
      upserts++;
      if (rejectSaves) return { error: { message: "Offline" } };
      cloud.set(row.key, row); return { error: null };
    },
  };
  return query;
} } });

async function recoveryCopies() {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("itss-unit-packs");
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  const result = await new Promise<any[]>((resolve, reject) => {
    const copies: any[] = [];
    const request = database.transaction("packs").objectStore("packs").openCursor();
    request.onsuccess = () => { const c = request.result; if (c) {
      if (String(c.key).startsWith("itssDevice.courseRecovery.")) copies.push(JSON.parse(c.value)); c.continue();
    } else resolve(copies); };
    request.onerror = () => reject(request.error);
  });
  database.close(); return result;
}
async function test() {
  localStorage.clear();
  const full = pack(33);
  const queueDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("itss-sync-pending", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("writes");
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = queueDatabase.transaction("writes", "readwrite");
    const store = tx.objectStore("writes");
    store.put({ userId: "content-user", key: packKey, value: pack(23), revision: "old" }, JSON.stringify(["content-user", packKey]));
    store.put({ tenantId: "investec", userId: "content-user", key: packKey, value: full, revision: "current" }, JSON.stringify(["investec", "content-user", packKey]));
    const legacyKey = "itss.unitbuilder.legacy-queued.shared";
    store.put({ userId: "content-user", key: legacyKey, value: full, revision: "legacy" }, JSON.stringify(["content-user", legacyKey]));
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  await persistUnitPack(packKey, full); rememberUnitPack(packKey, full);
  localStorage.setItem(editsKey, JSON.stringify({ deletedSections: [1, 2, 3], headings: { 0: "Old cached title" } }));
  await startSync("content-user");
  assert(unitPackSnapshot(packKey) === full, "First login after upgrade preserves the existing 33-slide pack");
  assert(localStorage.getItem(editsKey), "A missing tenant marker must not delete local edits");
  assert(upserts === 2 && cloud.get(packKey)?.value === full, "Legacy pending saves migrate without replacing a newer scoped save");
  assert(cloud.get("itss.unitbuilder.legacy-queued.shared")?.value === full, "Older explicit unsent course saves are not silently ignored");
  const queueRows = await new Promise<unknown[]>((resolve, reject) => {
    const request = queueDatabase.transaction("writes").objectStore("writes").getAll();
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  assert(queueRows.length === 0, "Migrated saves leave no orphaned legacy queue entries");
  queueDatabase.close();
  const explicitSaves = upserts;
  cloud.set(editsKey, { value: JSON.stringify({ headings: { 0: "Published title" }, deletedSections: [] }), updated_at: "1" });
  const loaded = await loadLessonEdits<any>(editsKey, {});
  assert(loaded.headings[0] === "Published title" && loaded.deletedSections.length === 0, "Published edits replace stale hidden-slide flags");
  assert(upserts === explicitSaves, "Reading legacy lesson edits performs no cloud writes");
  const stop = watchLessonEdits(editsKey);
  let refreshed = false;
  const unsubscribe = subscribeLessonEdits(editsKey, value => { refreshed = JSON.parse(value).headings?.[0] === "Updated by superuser"; });
  cloud.set(editsKey, { value: JSON.stringify({ headings: { 0: "Updated by superuser" }, deletedSections: [32] }), updated_at: "2" });
  window.dispatchEvent(new Event("focus"));
  for (let i = 0; i < 40 && !refreshed; i++) await tick();
  assert(refreshed, "Learner views refresh shared edits without a revision change");
  rejectSaves = true;
  queueLessonEdits(editsKey, { headings: { 0: "Unsaved staff edit" } });
  await tick(650);
  writeFromCloud(editsKey, JSON.stringify({ headings: { 0: "Stale cloud" } }));
  window.dispatchEvent(new Event("focus")); await tick();
  assert(cachedLessonEdits<any>(editsKey, {}).headings[0] === "Unsaved staff edit", "Failed pending saves survive cloud hydration and refresh");
  rejectSaves = false; await flushLessonEdits(editsKey);
  assert(JSON.parse(cloud.get(editsKey)!.value).headings[0] === "Unsaved staff edit", "Explicit staff saves still publish");
  await persistUnitPack(packKey, pack(23));
  const copies = await recoveryCopies();
  assert(copies.some(copy => copy.key === packKey && JSON.parse(copy.value).content.lesson.length === 33), "A replaced full unit remains recoverable");
  assert(copies.some(copy => copy.key === editsKey), "Replaced rich text and hidden-slide settings remain recoverable");
  assert((await storedUnitPacks()).every(([key]) => !key.startsWith("itssDevice.courseRecovery.")), "Recovery copies cannot be uploaded by ordinary sync");
  stop(); unsubscribe(); clearUnitPacks(); await tick();
  assert((await recoveryCopies()).length >= copies.length, "Signing out does not erase course recovery copies");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: upgrade preserves 33 slides; learner reads never republish caches; shared edits refresh; pending edits survive; original content remains recoverable";
}
test().catch(error => { document.body.dataset.result = "failed"; document.getElementById("result")!.textContent = String(error); });

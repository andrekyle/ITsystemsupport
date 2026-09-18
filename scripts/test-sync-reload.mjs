import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const file = join(mkdtempSync(join(tmpdir(), "sync-reload-")), "sync.mjs");
await build({ entryPoints: [resolve("src/lib/sync.ts")], bundle: true, platform: "node", format: "esm", outfile: file,
  plugins: [{ name: "mock-cloud", setup(b) {
    b.onResolve({ filter: /^\.\/supabase$/ }, () => ({ path: "cloud", namespace: "fixture" }));
    b.onResolve({ filter: /^\.\/unitStorage$/ }, () => ({ path: "packs", namespace: "fixture" }));
    b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "cloud"
      ? "export const supabase = globalThis.testCloud;"
      : "export const isUnitPackKey = () => false; export const receiveUnitPack = () => {}; export const storedUnitPacks = async () => []; export const clearUnitPacks = () => {};" }));
  } }] });

const key = "itss.lessonedits.114059.built-version1";
globalThis.window = new EventTarget();
const cloud = new Map([[key, "old text"]]);
let failure = false;
globalThis.testCloud = { from(table) {
  return {
    select() { const result = Promise.resolve({ data: table === "shared_state" ? [...cloud].map(([key, value]) => ({ key, value })) : [], error: null }); result.eq = () => result; return result; },
    async upsert(row) { if (failure) return { error: { message: "Offline" } }; cloud.set(row.key, row.value); return { error: null }; },
    delete() { return { async eq(_column, key) { if (failure) return { error: { message: "Offline" } }; cloud.delete(key); return { error: null }; } }; },
  };
} };
function storage(entries = []) {
  const data = new Map(entries);
  return { get length() { return data.size; }, key(i) { return [...data.keys()][i] ?? null; }, getItem(key) { return data.get(key) ?? null; }, setItem(key, value) { data.set(key, value); }, removeItem(key) { data.delete(key); }, snapshot() { return [...data]; } };
}
let sequence = 0;
async function boot(entries = []) {
  globalThis.localStorage = storage(entries);
  const sync = await import(`${pathToFileURL(file).href}?boot=${sequence++}`);
  sync.installSync();
  await sync.startSync("user-a");
  return sync;
}
let sync = await boot();
localStorage.setItem(key, "new text before debounce");
sync.stopSync(); // reload before the delayed network write starts
sync = await boot(localStorage.snapshot());
assert.equal(localStorage.getItem(key), "new text before debounce", "reload must not overwrite pending edits");
assert.equal(cloud.get(key), "new text before debounce", "reload retries the pending write");

failure = true;
localStorage.setItem(key, "offline text");
await assert.rejects(sync.flushKey(key, true), /Cloud save failed/, "explicit save must report cloud errors");
sync.stopSync();
sync = await boot(localStorage.snapshot());
assert.equal(localStorage.getItem(key), "offline text", "returned API errors preserve local edits");
sync.writeFromCloud(key, "stale background refresh");
assert.equal(localStorage.getItem(key), "offline text", "background refresh must preserve pending edits");
failure = false;
await sync.startSync("user-a");
assert.equal(cloud.get(key), "offline text");
assert.deepEqual(JSON.parse(localStorage.getItem("itss.syncPending")), [], "successful writes clear the queue");
localStorage.setItem(key, "explicit cloud save");
await sync.flushKey(key, true);
assert.equal(cloud.get(key), "explicit cloud save", "explicit save waits for cloud persistence");

failure = true;
localStorage.removeItem(key);
sync.stopSync();
sync = await boot(localStorage.snapshot());
assert.equal(localStorage.getItem(key), null, "reload must not restore an unsynced deletion");
failure = false;
await sync.startSync("user-a");
assert.equal(cloud.has(key), false, "deleted values are retried as deletions");
sync.stopSync();
await assert.rejects(sync.flushKey(key, true), /signed-in account/, "signed-out save cannot report success");
console.log("PASS: reload, API failure, stale refresh, retry, deletion, confirmed cloud save, signed-out rejection");

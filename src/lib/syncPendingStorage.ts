export type PendingWrite = {
  userId: string;
  key: string;
  value: string | null;
  revision: string;
};

export const PENDING_KEY = "itss.syncPending";
const STORE = "writes";
let database: Promise<IDBDatabase> | undefined;
let initialized: Promise<void> | undefined;
let operations: Promise<void> = Promise.resolve();
const writes = new Map<string, PendingWrite>();

const id = (write: Pick<PendingWrite, "userId" | "key">) =>
  JSON.stringify([write.userId, write.key]);

function db() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("itss-sync-pending", 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(error => {
    database = undefined;
    throw error;
  });
}

async function persist(write: PendingWrite, remove = false) {
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    if (remove) store.delete(id(write));
    else store.put(write, id(write));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Migrate only after durable persistence, so a failed migration loses nothing. */
export function loadPendingWrites(): Promise<void> {
  return initialized ??= (async () => {
    const database = await db();
    const stored = await new Promise<PendingWrite[]>((resolve, reject) => {
      const request = database.transaction(STORE).objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as PendingWrite[]);
      request.onerror = () => reject(request.error);
    });
    const legacy = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]") as PendingWrite[];
    for (const write of legacy) {
      if (!stored.some(saved => id(saved) === id(write))) {
        await persist(write);
        stored.push(write);
      }
    }
    for (const write of stored) {
      if (!writes.has(id(write))) writes.set(id(write), write);
    }
    Storage.prototype.removeItem.call(localStorage, PENDING_KEY);
  })().catch(error => {
    initialized = undefined;
    throw error;
  });
}

export function pendingWrites(): PendingWrite[] {
  return [...writes.values()];
}

function serialize(operation: () => Promise<void>): Promise<void> {
  const result = operations.then(operation);
  // A failed operation must not prevent a later explicit retry.
  operations = result.catch(() => {});
  return result;
}

export function rememberPendingWrite(write: PendingWrite): Promise<void> {
  writes.set(id(write), write);
  return serialize(async () => {
    await loadPendingWrites();
    await persist(write);
  });
}

export function forgetPendingWrite(write: PendingWrite): Promise<void> {
  return serialize(async () => {
    if (writes.get(id(write))?.revision !== write.revision) return;
    await persist(write, true);
    if (writes.get(id(write))?.revision === write.revision) writes.delete(id(write));
  });
}

export function waitForPendingWrites(): Promise<void> {
  return operations;
}

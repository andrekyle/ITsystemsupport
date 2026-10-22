import { TENANT_ID } from "./tenant";

export type PendingWrite = {
  userId: string;
  tenantId?: string;
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

const id = (write: Pick<PendingWrite, "userId" | "tenantId" | "key">) =>
  JSON.stringify([write.tenantId ?? "legacy", write.userId, write.key]);

function db() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    // Retain Investec's existing queue; Discovery must not replay its pending saves.
    const request = indexedDB.open(TENANT_ID === "investec" ? "itss-sync-pending" : `itss-sync-pending-${TENANT_ID}`, 1);
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

/** Legacy unscoped queues belong to Investec; migrate only after durable persistence. */
export function loadPendingWrites(): Promise<void> {
  return initialized ??= (async () => {
    const database = await db();
    const rows = await new Promise<{ keys: IDBValidKey[]; values: PendingWrite[] }>((resolve, reject) => {
      const tx = database.transaction(STORE);
      const store = tx.objectStore(STORE);
      const keys = store.getAllKeys();
      const values = store.getAll();
      tx.oncomplete = () => resolve({ keys: keys.result, values: values.result });
      tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
    const stored = rows.values.filter(write => !!write.tenantId);
    // Queues are already stored in a tenant-specific database. Upgrade the
    // older records before sync starts filtering by tenant, without replacing
    // an existing explicitly scoped save for the same account/key.
    for (let index = 0; index < rows.values.length; index++) {
      const previous = rows.values[index];
      if (previous.tenantId) continue;
      const upgraded = { ...previous, tenantId: TENANT_ID };
      const current = stored.find(write => id(write) === id(upgraded)) ?? upgraded;
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        store.put(current, id(current));
        if (rows.keys[index] !== id(current)) store.delete(rows.keys[index]);
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
      if (!stored.includes(current)) stored.push(current);
    }
    const legacy = (TENANT_ID === "investec"
      ? JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]")
      : []) as PendingWrite[];
    for (const previous of legacy) {
      const write = { ...previous, tenantId: previous.tenantId ?? TENANT_ID };
      if (!stored.some(saved => id(saved) === id(write))) {
        await persist(write);
        stored.push(write);
      }
    }
    for (const write of stored) {
      if (!writes.has(id(write))) writes.set(id(write), write);
    }
    if (TENANT_ID === "investec") Storage.prototype.removeItem.call(localStorage, PENDING_KEY);
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

// Run as a DevTools Console snippet ON THE ORIGINAL LEARNER WEBSITE/DEVICE.
// Reads saved work only. Does not sign out, clear storage, call the network,
// upload anything, or change app records. Downloads a private recovery JSON.
// Keep the app tab open; do not reload it just to run this snippet.
(async () => {
  const learners = new Map([
    ['p_mrom4usy_le6ki', 'Anele Khanyile'],
    ['p_mrom65g0_ho04y', 'Mpumelelo Hlongwane'],
    ['p_mromq49w_0jfmq', 'Ntokozo Ngcobo'],
    ['p_mrom0udn_jcpeg', 'Pontsho Molekane'],
  ]);
  const names = new Set([...learners.values()].map(name => name.toLowerCase()));
  const output = {
    exportedAt: new Date().toISOString(), origin: location.origin,
    learners: [], localStorage: [], sessionStorage: [], indexedDB: [], errors: [],
  };
  // Learn alternate IDs without exporting profile passwords or account tokens.
  try {
    const profiles = JSON.parse(localStorage.getItem('itss.profiles') ?? '[]');
    for (const profile of profiles) {
      const name = String(profile.name ?? '').trim();
      const enrolName = [profile.enrolment?.firstNames, profile.enrolment?.surname].filter(Boolean).join(' ').trim();
      if (profile.id && (learners.has(profile.id) || names.has(name.toLowerCase()) || names.has(enrolName.toLowerCase()))) {
        learners.set(profile.id, name || enrolName || learners.get(profile.id));
      }
    }
  } catch (error) { output.errors.push('Profiles: ' + error.message); }
  output.learners = [...learners].map(([id, name]) => ({ id, name }));
  const wanted = key => typeof key === 'string' && key.startsWith('itss.')
    && key.split('.').some(segment => learners.has(segment));
  function collectStorage(storage, destination) {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (wanted(key)) destination.push({ key, value: storage.getItem(key) });
      // Device-wide legacy lesson positions are candidates only, not evidence
      // identifying which learner completed an activity.
      else if (key?.startsWith('lessonStep:')) {
        destination.push({ key, value: storage.getItem(key), attribution: 'legacy-device-wide; confirm learner' });
      } else if (key === 'itss.syncPending') {
        try {
          const writes = JSON.parse(storage.getItem(key) ?? '[]').filter(write => wanted(write.key));
          if (writes.length) destination.push({ key, value: JSON.stringify(writes) });
        } catch (error) { output.errors.push('Legacy pending saves: ' + error.message); }
      }
    }
  }
  try { collectStorage(localStorage, output.localStorage); }
  catch (error) { output.errors.push('localStorage: ' + error.message); }
  try { collectStorage(sessionStorage, output.sessionStorage); }
  catch (error) { output.errors.push('sessionStorage: ' + error.message); }
  async function readExistingDatabase(name, storeName, pending) {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      // Abort if removed since enumeration; never create an empty database.
      request.onupgradeneeded = () => request.transaction.abort();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onblocked = () => reject(new Error('Database is blocked: ' + name));
    });
    try {
      if (!database.objectStoreNames.contains(storeName)) return;
      const records = await new Promise((resolve, reject) => {
        const rows = [];
        const transaction = database.transaction(storeName, 'readonly');
        const request = transaction.objectStore(storeName).openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          const key = pending ? cursor.value?.key : String(cursor.key);
          if (wanted(key)) rows.push({ key: String(cursor.key), value: cursor.value });
          cursor.continue();
        };
        transaction.oncomplete = () => resolve(rows);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      output.indexedDB.push({ database: name, store: storeName, records });
    } finally { database.close(); }
  }
  try {
    if (typeof indexedDB.databases !== 'function') {
      output.errors.push('Browser cannot enumerate IndexedDB; no databases were opened.');
    } else {
      const existing = new Set((await indexedDB.databases()).map(database => database.name));
      for (const [name, store, pending] of [
        ['itss-unit-packs', 'packs', false], ['itss-sync-pending', 'writes', true],
      ]) {
        if (!existing.has(name)) continue;
        try { await readExistingDatabase(name, store, pending); }
        catch (error) { output.errors.push(name + ': ' + error.message); }
      }
    }
  } catch (error) { output.errors.push('IndexedDB: ' + error.message); }
  const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'learner-browser-recovery-' + Date.now() + '.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  console.log('Recovery export downloaded. Keep the JSON private. Issues:', output.errors);
})();

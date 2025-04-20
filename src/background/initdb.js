const DB_NAME = 'firefoxRecapDB';
const DB_VERSION = 1;

export let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log(`IndexedDB initialized: ${DB_NAME} v${DB_VERSION}`);
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const idb = event.target.result;

      // historyItems store
      if (!idb.objectStoreNames.contains('historyItems')) {
        const historyStore = idb.createObjectStore('historyItems', {
          keyPath: 'id',
          autoIncrement: true,
        });
        historyStore.createIndex('url', 'url', {unique: false});
        historyStore.createIndex('lastVisitTime', 'lastVisitTime', {
          unique: false,
        });
        historyStore.createIndex('domain', 'domain', {unique: false});
      }

      // visitDetails store
      if (!idb.objectStoreNames.contains('visitDetails')) {
        const visitsStore = idb.createObjectStore('visitDetails', {
          keyPath: 'visitId',
        });
        visitsStore.createIndex('url', 'url', {unique: false});
        visitsStore.createIndex('visitTime', 'visitTime', {unique: false});
      }

      // categories store
      if (!idb.objectStoreNames.contains('categories')) {
        const categoriesStore = idb.createObjectStore('categories', {
          keyPath: 'url',
        });
        // multiEntry index if you want to query by individual labels
        categoriesStore.createIndex('label', 'categories.label', {
          unique: false,
          multiEntry: true,
        });
      }

      console.log(`Upgraded IndexedDB to version ${DB_VERSION}`);
    };
  });
}

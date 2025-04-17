const dbName = 'firefoxRecapDB';
const dbVersion = 1;
let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('Database initialized successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('historyItems')) {
        const historyStore = db.createObjectStore('historyItems', {
          keyPath: 'id',
          autoIncrement: true,
        });
        historyStore.createIndex('url', 'url', {unique: false});
        historyStore.createIndex('lastVisitTime', 'lastVisitTime', {
          unique: false,
        });
        historyStore.createIndex('domain', 'domain', {unique: false});
      }

      if (!db.objectStoreNames.contains('visitDetails')) {
        const visitsStore = db.createObjectStore('visitDetails', {
          keyPath: 'visitId',
        });
        visitsStore.createIndex('url', 'url', {unique: false});
        visitsStore.createIndex('visitTime', 'visitTime', {unique: false});
      }
      // the goal is to store the category of the URL from the firefoxrecap/url-title-classifier
      if (!db.objectStoreNames.contains('categories')) {
        const categoriesStore = db.createObjectStore('categories', {
          keyPath: 'url',
        });
        categoriesStore.createIndex('category', 'category', {unique: false});
      }
    };
  });
}


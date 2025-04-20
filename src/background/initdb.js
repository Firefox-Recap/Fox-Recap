import Dexie from 'dexie';

const DB_NAME = 'firefoxRecapDB';
const DB_VERSION = 1;

export const db = new Dexie(DB_NAME);

db.version(DB_VERSION).stores({
  // add a compound index for faster dedupe lookups
  historyItems: '++id, [url+lastVisitTime], url, lastVisitTime',
  visitDetails: 'visitId, url, visitTime, [url+visitTime]',
  categories: 'url, *categories.label, lastVisitTime'
});

export function initDB() {
  return db.open()
    .then(() => {
      console.log(`Dexie DB initialized: ${DB_NAME} v${DB_VERSION}`);
      return db;
    })
    .catch((err) => {
      console.error('Dexie open error:', err);
      throw err;
    });
}

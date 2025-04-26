/**
 * @module background/initdb
 * @description
 * Sets up and opens the IndexedDB via Dexie for storing:
 *  - Browsing history items
 *  - Detailed visit events
 *  - ML‑generated categories per URL
 */

import Dexie from 'dexie';

/**
 * Name of the IndexedDB database.
 * @constant {string}
 */
const DB_NAME = 'firefoxRecapDB';

/**
 * Version number of the database schema. Bump to trigger upgrades.
 * @constant {number}
 */
const DB_VERSION = 1;

/**
 * Dexie instance representing our local database.
 *
 * Schema stores:
 *  - historyItems:  
 *      • primary key: auto‑incremented `id`  
 *      • compound index `[url+lastVisitTime]` for fast de‑duplication  
 *      • individual indexes on `url` and `lastVisitTime` for common queries  
 *
 *  - visitDetails:  
 *      • primary key: `visitId`  
 *      • indexes on `url` and `visitTime`  
 *      • compound index `[url+visitTime]` to quickly fetch visits for a URL in time order  
 *
 *  - categories:  
 *      • primary key: `url`  
 *      • multi‑entry index `*categories.label` to efficiently query all URLs in a given category  
 *      • index on `lastVisitTime` to filter recent classifications  
 *
 * @type {Dexie}
 */
export const db = new Dexie(DB_NAME);

db.version(DB_VERSION).stores({
  historyItems:  '++id, [url+lastVisitTime], url, lastVisitTime',
  visitDetails:  'visitId, url, visitTime, [url+visitTime]',
  categories:    'url, *categories.label, lastVisitTime'
});

/**
 * Opens the Dexie database, creating object stores as defined above.
 * Logs success or error.
 *
 * @async
 * @returns {Promise<Dexie>} resolves with the open database instance
 * @throws {Error} if the database fails to open
 */
export async function initDB() {
  try {
    const instance = await db.open();
    console.log(`Dexie DB initialized: ${DB_NAME} v${DB_VERSION}`);
    return instance;
  } catch (err) {
    console.error('Dexie open error:', err);
    throw err;
  }
}

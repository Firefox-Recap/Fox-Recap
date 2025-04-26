import { db } from '../initdb.js';
import { classifyURLAndTitle } from './ml.js';

// stores many history items in one bulk transaction using dexie.js for this benefit

/**
 * Stores multiple browsing history items in IndexedDB in one atomic transaction.
 *
 * @async
 * @function storeHistoryItems
 * @param {Array<Object>} items                     - Array of history entries.
 * @param {string}       items[].url                - The visited URL.
 * @param {string}       items[].title              - The page title.
 * @param {number}       items[].lastVisitTime      - Last visit timestamp (ms).
 * @param {number}       items[].visitCount         - Total visit count for this URL.
 * @param {number}       items[].typedCount         - How many times URL was typed.
 * @returns {Promise<number>}                       Number of records written.
 */
export async function storeHistoryItems(items) {
  if (!items.length) return 0;
  const toPut = items.map(i => ({
    url: i.url,
    title: i.title,
    lastVisitTime: i.lastVisitTime,
    visitCount: i.visitCount,
    typedCount: i.typedCount
  }));
  await db.transaction('rw', db.historyItems, async () => {
    await db.historyItems.bulkPut(toPut);
  });
  return toPut.length;
}

// stores many visit details in one bulk transaction
/**
 * Stores visit‐by‐visit details for a single URL in one atomic transaction.
 *
 * @async
 * @function storeVisitDetails
 * @param {string}               url    - The URL these visit entries belong to.
 * @param {Array<Object>}        visits - Array of visit records.
 * @param {number}               visits[].visitId           - Unique visit identifier.
 * @param {number}               visits[].visitTime         - Timestamp of the visit (ms).
 * @param {number}               visits[].referringVisitId  - Parent visit ID.
 * @param {string}               visits[].transition        - Navigation transition type.
 * @returns {Promise<number>}                            Number of records written.
 */
export async function storeVisitDetails(url, visits) {
  if (!visits.length) return 0;
  const toPut = visits.map(v => ({
    visitId: v.visitId,
    url,
    visitTime: v.visitTime,
    referringVisitId: v.referringVisitId,
    transition: v.transition
  }));
  await db.transaction('rw', db.visitDetails, async () => {
    await db.visitDetails.bulkPut(toPut);
  });
  return toPut.length;
}

// single‐record write—no need for manual Promise wrapping
/**
 * Classifies a URL and title via ML and stores the resulting categories.
 * 
 * // This function would use bulkput method if browser.run.engine has bulk classification.
 *
 * @async
 * @function storeCategories
 * @param {string} url               - The URL to classify.
 * @param {string} title             - The page title to classify.
 * @param {number} lastVisitTime     - Timestamp of last visit (ms).
 * @returns {Promise<void>}          Resolves when write is complete.
 * @throws {Error}                   If classification or storage fails.
 */
export async function storeCategories(url, title, lastVisitTime) {
  try {
    const categories = await classifyURLAndTitle(url, title, 0.5);
    await db.transaction('rw', db.categories, async () => {
      await db.categories.put({ url, categories, lastVisitTime });
    });
  } catch (err) {
    console.error('Error classifying or storing categories:', err);
    throw err;
  }
}

import { db } from '../initdb.js';

/**
 * Return the top‐visited URLs in the last `days` days, up to `limit`.
 * @param {number} days
 * @param {number} [limit=5]
 * @returns {Promise<Array<{url: string, count: number}>>}
 */
export async function getMostVisitedSites(days, limit = 5) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  // instead of historyItems, read from visitDetails to count actual visits
  const tx = db.transaction('visitDetails', 'readonly');
  const store = tx.objectStore('visitDetails');
  const index = store.index('visitTime');
  const range = IDBKeyRange.lowerBound(cutoff);

  const counts = new Map();
  return new Promise((resolve, reject) => {
    const req = index.openCursor(range);
    req.onsuccess = (evt) => {
      const cursor = evt.target.result;
      if (cursor) {
        const { url } = cursor.value;
        counts.set(url, (counts.get(url) || 0) + 1);
        cursor.continue();
      } else {
        const result = Array.from(counts.entries())
          .map(([url, count]) => ({ url, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
        resolve(result);
      }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}
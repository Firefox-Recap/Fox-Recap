import { db } from '../initdb.js';

/**
 * Return the top‐visited URLs in the last `days` days, up to `limit`.
 */
export async function getMostVisitedSites(days, limit = 5) {
  // make sure our IndexedDB is ready

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const tx    = db.transaction('visitDetails', 'readonly');
  const index = tx.objectStore('visitDetails').index('visitTime');

  // pull all visitDetails since cutoff in one go
  const entries = await new Promise((resolve, reject) => {
    const req = index.getAll(IDBKeyRange.lowerBound(cutoff));
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });

  // tally visits per URL
  const counts = entries.reduce((map, { url }) => {
    map.set(url, (map.get(url) || 0) + 1);
    return map;
  }, new Map());

  // sort & trim to `limit`
  return Array.from(counts, ([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
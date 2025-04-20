import { db } from '../initdb.js';

export async function getDailyVisitCounts(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const tx     = db.transaction('visitDetails','readonly');
  const idx    = tx.objectStore('visitDetails').index('visitTime');

  const entries = await new Promise((res, rej) => {
    const req = idx.getAll(IDBKeyRange.lowerBound(cutoff));
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });

  // tally per calendar‐date
  const counts = entries.reduce((map, { visitTime }) => {
    const day = new Date(visitTime).toISOString().slice(0,10); // YYYY‑MM‑DD
    map.set(day, (map.get(day)||0) + 1);
    return map;
  }, new Map());

  // build sorted array
  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a,b) => a.date.localeCompare(b.date));
}
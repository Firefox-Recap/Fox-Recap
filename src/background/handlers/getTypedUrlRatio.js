import { db } from '../initdb.js';
// this now accepts a limit for number of results; cutoff date is in days
export async function getTypedUrlRatio(days = 30, limit = 5) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const tx = db.transaction('historyItems', 'readonly');
  const store = tx.objectStore('historyItems');
  const idx = store.index('lastVisitTime');

  const items = await new Promise((res, rej) => {
    const req = idx.getAll(IDBKeyRange.lowerBound(cutoff));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });

  // aggregate per‑domain
  const agg = items.reduce((map, { url, visitCount = 0, typedCount = 0 }) => {
    let host;
    try { host = new URL(url).hostname; }
    catch { return map; }
    const entry = map.get(host) || { totalVisits: 0, totalTyped: 0 };
    entry.totalVisits += visitCount;
    entry.totalTyped += typedCount;
    map.set(host, entry);
    return map;
  }, new Map());

  // build sorted array by ratio
  const result = Array.from(agg.entries())
    .map(([domain, { totalVisits, totalTyped }]) => ({
      domain,
      totalVisits,
      totalTyped,
      ratio: totalVisits > 0
        ? +(totalTyped / totalVisits).toFixed(3)
        : 0
    }))
    .sort((a, b) => b.ratio - a.ratio);

  // apply limit if it's a finite number
  const limited = Number.isFinite(limit)
    ? result.slice(0, limit)
    : result;

  return limited;
}
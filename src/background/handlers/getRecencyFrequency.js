import { db } from '../initdb.js';
// this needs to accept a limit for the output and cutoff date is days
export async function getRecencyFrequency(days, limit = 5) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const tx = db.transaction('visitDetails', 'readonly');
  const idx = tx.objectStore('visitDetails').index('visitTime');
  const visits = await new Promise((res, rej) => {
    const req = idx.getAll(IDBKeyRange.lowerBound(cutoff));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });

  // aggregate per‑domain
  const stats = visits.reduce((acc, { url, visitTime }) => {
    let domain;
    try {
      domain = new URL(url).hostname;
    } catch {
      return acc;
    }
    const s = acc[domain] || { count: 0, lastVisit: 0 };
    s.count++;
    s.lastVisit = Math.max(s.lastVisit, visitTime);
    acc[domain] = s;
    return acc;
  }, {});

  // compute score = freq / (1 + days_since_last_visit)
  const msPerDay = 24 * 60 * 60 * 1000;
  const result = Object.entries(stats)
    .map(([domain, { count, lastVisit }]) => {
      const daysSince = (now - lastVisit) / msPerDay;
      const score = count / (1 + daysSince);
      return {
        domain,
        count,
        lastVisit,
        daysSince: +daysSince.toFixed(2),
        score: +score.toFixed(2)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return result;
}
import { db } from '../initdb.js';

export async function getRecencyFrequency(days, limit = 5) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const cutoff = now - days * msPerDay;

  // fetch only visits on or after cutoff using the visitTime index
  const visits = await db.visitDetails
    .where('visitTime')
    .aboveOrEqual(cutoff)
    .toArray();

  // aggregate counts and lastVisit per domain
  const stats = new Map();
  for (const { url, visitTime } of visits) {
    let domain;
    try {
      domain = new URL(url).hostname;
    } catch {
      continue;
    }
    const entry = stats.get(domain) || { count: 0, lastVisit: 0 };
    entry.count++;
    if (visitTime > entry.lastVisit) entry.lastVisit = visitTime;
    stats.set(domain, entry);
  }

  // compute score, sort and limit
  const result = [...stats.entries()]
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
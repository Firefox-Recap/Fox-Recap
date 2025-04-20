import { db } from '../initdb.js';
// this can be optimized i just dont know how
export async function getMostVisitedSites(days, limit = 5) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const visits = await db.visitDetails
    .where('visitTime')
    .above(cutoff)
    .toArray(); 
  const counts = visits.reduce((map, { url }) => {
    map.set(url, (map.get(url) || 0) + 1);
    return map;
  }, new Map());
  return Array.from(counts, ([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
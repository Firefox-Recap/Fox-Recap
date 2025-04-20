import { db } from '../initdb.js';

export async function getDailyVisitCounts(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const counts = new Map();

  await db.visitDetails
    .where('visitTime')
    .aboveOrEqual(cutoff)
    .each(({ visitTime }) => {
      const day = new Date(visitTime).toISOString().slice(0, 10);
      counts.set(day, (counts.get(day) || 0) + 1);
    });

  return Array.from(counts, ([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
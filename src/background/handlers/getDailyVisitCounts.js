import { MS_PER_DAY } from '../../config.js';
import { db } from '../initdb.js';

export async function getDailyVisitCounts(days) {
  const cutoff = Date.now() - days * MS_PER_DAY;
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
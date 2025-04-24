import { db } from '../initdb.js';
import { MS_PER_DAY } from '../../config.js';

export async function getCategoryTrends(days) {
  const cutoff = Date.now() - days * MS_PER_DAY;

  const entries = await db.categories
    .where('lastVisitTime')
    .aboveOrEqual(cutoff)
    .toArray();

  const dailyCounts = entries.reduce((acc, { lastVisitTime, categories = [] }) => {
    const day = new Date(lastVisitTime).toISOString().slice(0, 10);
    const dayBucket = acc[day] || (acc[day] = {});

    for (const cat of categories) {
      const label = typeof cat === 'string' ? cat : cat?.label;
      if (label) {
        dayBucket[label] = (dayBucket[label] || 0) + 1;
      }
    }
    return acc;
  }, {});

  return Object.entries(dailyCounts)
    .map(([date, counts]) => ({
      date,
      categories: Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
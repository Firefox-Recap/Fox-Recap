/**
 * @fileoverview
 * Generate daily category trends data over a specified time window.
 */

import { db } from '../initdb.js';
import { MS_PER_DAY } from '../../config.js';

/**
 * Get category trends for each day in the past `days` days.
 *
 * @async
 * @param {number} days
 *   How many days of history to include (e.g. 7 for the last week).
 * @returns {Promise<Array<Object>>}
 *   Resolves to an array of daily trend objects up bounded to 10 objects, sorted by date:
 *   [
 *     {
 *       date: string,           // ISO date (YYYY-MM-DD)
 *       categories: [           // Sorted by descending count
 *         { label: string, count: number }
 *       ]
 *     },
 *     ...
 *   ]
 */
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
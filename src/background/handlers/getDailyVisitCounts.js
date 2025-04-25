/**
 * @fileoverview
 * Fetches the number of visits per day over a lookback window and
 * returns an array of `{ date, count }` objects sorted by date.
 *
 * @module getDailyVisitCounts
 */

import { MS_PER_DAY } from '../../config.js';
import { db } from '../initdb.js';

/**
 * Get daily visit counts for the past `days` days.
 *
 * @async
 * @param {number} days
 *   How many days of history to include (e.g. 7 for the last week).
 * @returns {Promise<Array<DailyVisitCount>>}
 *   Resolves to an array of objects:
 *   [
 *     { date: 'YYYY-MM-DD', count: number },
 *     ...
 *   ]
 *
 * @typedef {Object} DailyVisitCount
 * @property {string} date    ISO date string (YYYY‑MM‑DD)
 * @property {number} count   Number of visits on that date
 */
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
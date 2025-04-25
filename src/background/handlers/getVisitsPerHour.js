/**
 * @fileoverview
 * Fetches visit details from the IndexedDB and aggregates counts per hour
 * over a specified look‑back window.
 *
 * @module background/handlers/getVisitsPerHour
 */

import { db } from '../initdb.js';

/**
 * Represents aggregated visit statistics for a single hour.
 *
 * @typedef {Object} VisitPerHour
 * @property {number} hour        Hour of day (0–23).
 * @property {number} totalVisits Total visits in that hour across all days.
 * @property {number} count       Average visits per day for that hour (two‑decimal precision).
 */

/**
 * Get the number of visits per hour for the past `days` days.
 *
 * Scans the `visitDetails` store between the start of the earliest day
 * and the end of the latest day, buckets visits by hour of day,
 * and computes an average per day.
 *
 * @async
 * @param {number} days Look‑back window in days (e.g., 7 for the last week).
 * @returns {Promise<VisitPerHour[]>} Resolves to an array of hourly visit stats.
 */
export async function getVisitsPerHour(days) {
    //Compute start & end timestamps
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const start = startDate.getTime();
    const end = endDate.getTime();

    // Fetch all visitDetails in one Dexie query
    const entries = await db.visitDetails
      .where('visitTime')
      .between(start, end, true, true)
      .toArray();

    // Aggregate counts
    const hourCounts = new Array(24).fill(0);
    const seenDates = new Set();

    for (const { visitTime } of entries) {
      const d = new Date(visitTime);
      hourCounts[d.getHours()]++;
      seenDates.add(d.toDateString());
    }

    const totalDays = Math.max(seenDates.size, 1);

    //  Build result array
    return hourCounts.map((totalVisits, hour) => ({
      hour,
      totalVisits,
      count: +(totalVisits / totalDays).toFixed(2)
    }));
}
/**
 * @fileoverview
 * Generate a list of the most visited websites within a specified time window.
 * @module background/handlers/getMostVisitedSites
 */

import { MS_PER_DAY } from '../../config.js';
import { db } from '../initdb.js';

/**
 * Entry describing a most‐visited site.
 * @typedef {Object} MostVisitedSite
 * @property {string} url   The visited URL.
 * @property {number} count The number of visits to this URL.
 */

/**
 * Fetch and count the most visited sites in the past {@link days} days.
 *
 * @async
 * @param {number} days           Look‑back window in days.
 * @param {number} [limit=5]      Maximum number of sites to return.
 * @returns {Promise<MostVisitedSite[]>}
 *   Resolves with an array of most visited site objects, sorted descending by count.
 */
export async function getMostVisitedSites(days, limit = 5) {
  const cutoff = Date.now() - days * MS_PER_DAY;
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
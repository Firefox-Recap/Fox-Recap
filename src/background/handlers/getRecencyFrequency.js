/**
 * @fileoverview
 * Generate recency & frequency statistics for each domain visited
 * within a specified look‑back window.
 * @module background/handlers/getRecencyFrequency
 */

import { db } from '../initdb.js';
import { MS_PER_DAY } from '../../config.js';

/**
 * Represents recency & frequency stats for a single domain.
 * @typedef {Object} RecencyFrequencyEntry
 * @property {string} domain     The domain name.
 * @property {number} count      Total number of visits.
 * @property {number} lastVisit  Timestamp of the most recent visit (ms since epoch).
 * @property {number} daysSince  Number of days since the last visit.
 * @property {number} score      Computed recency‑frequency score.
 */

/**
 * Compute recency & frequency stats for domains visited in the past `days` days.
 *
 * @async
 * @param {number} days           Look‑back window in days.
 * @param {number} [limit=5]      Maximum number of domains to return.
 * @returns {Promise<RecencyFrequencyEntry[]>}
 *   Resolves with an array of domain stats sorted descending by score.
 */
export async function getRecencyFrequency(days, limit = 5) {
  const now = Date.now();
  const cutoff = now - days * MS_PER_DAY;

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
      const daysSince = (now - lastVisit) / MS_PER_DAY;
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
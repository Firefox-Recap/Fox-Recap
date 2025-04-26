/**
 * @fileoverview
 * Fetch and count the number of unique website domains visited
 * within a specified look‑back window.
 *
 * @module background/handlers/getUniqueWebsites
 */

import { db } from '../initdb.js';
import { parse } from 'tldts';
import { MS_PER_DAY } from '../../config.js';

/**
 * Get the number of unique domains visited in the last `days` days.
 *
 * @async
 * @param {number} days - Look‑back window in days.
 * @returns {Promise<number>} Resolves with the count of unique domains.
 */
export async function getUniqueWebsites(days) {
  const cutoff = Date.now() - days * MS_PER_DAY;
  const uniqueDomains = new Set();

  await db.historyItems
    .where('lastVisitTime')
    .aboveOrEqual(cutoff)
    .each(({ url }) => {
      try {
        const { domain } = parse(url);
        if (domain) {
          uniqueDomains.add(domain);
        }
      } catch (err) {
        console.warn('Failed to parse URL:', url, err);
      }
    });

  return uniqueDomains.size;
}
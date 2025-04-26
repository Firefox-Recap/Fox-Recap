/**
 * @fileoverview Fetch and count all category labels from IndexedDB within
 *   a given look‑back window.
 * @module background/handlers/getLabelCounts
 */

import { db } from '../initdb.js';
import { CATEGORIES, MS_PER_DAY } from '../../config.js';

/**
 * @typedef LabelCount
 * @type {object}
 * @property {string[]} categories Array containing the category label.
 * @property {number}   count      Number of occurrences of that label.
 */

/**
 * Get the number of times each category appears in the last `days` days.
 *
 * Only entries whose `lastVisitTime` ≥ cutoff (now − days × MS_PER_DAY) are counted.
 * Ensures every category in the global `CATEGORIES` list is represented.
 *
 * @async
 * @param {number} days Look‑back window in days.
 * @returns {Promise<LabelCount[]>} Resolves to an array of `{categories, count}` objects.
 */
export async function getLabelCounts(days) {
  const cutoff = Date.now() - days * MS_PER_DAY;

  // only load categories with lastVisitTime ≥ cutoff
  const records = await db.categories
    .where('lastVisitTime')
    .aboveOrEqual(cutoff)
    .toArray();

  const labelCounts = records.reduce((acc, { categories }) => {
    ;(categories || []).forEach(cat => {
      const label = typeof cat === 'string' ? cat : cat?.label;
      if (label) acc[label] = (acc[label] || 0) + 1;
    });
    return acc;
  }, {});

  // Ensure every defined category appears, even if count is 0
  return CATEGORIES.map(label => ({
    categories: [label],
    count: labelCounts[label] || 0
  }));
}
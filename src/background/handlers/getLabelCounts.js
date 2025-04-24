import {db} from '../initdb.js';
import { CATEGORIES, MS_PER_DAY } from '../../config.js';

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
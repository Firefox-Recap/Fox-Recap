import {db} from '../initdb.js';

// Map scores to labels
const CATEGORIES = [
  'News',
  'Entertainment',
  'Shop',
  'Chat',
  'Education',
  'Government',
  'Health',
  'Technology',
  'Work',
  'Travel',
  'Uncategorized',
];

export async function getLabelCounts(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

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
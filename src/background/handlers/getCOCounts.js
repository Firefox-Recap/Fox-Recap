import { db } from '../initdb.js';

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


export async function getCOCounts(day) {
  const cutoff = Date.now() - day * 24 * 60 * 60 * 1000;
  const coOccurCounts = {};

  // run a readonly transaction over the categories table
  await db.transaction('readonly', db.categories, async () => {
    // only iterate entries whose lastVisitTime ≥ cutoff
    await db.categories
      .where('lastVisitTime')
      .aboveOrEqual(cutoff)
      .each(({ categories }) => {
        if (!categories || categories.length < 2) return;

        // normalize to labels
        const labels = categories
          .map(cat => (typeof cat === 'string' ? cat : cat?.label))
          .filter(Boolean);

        // count each unique pair
        for (let i = 0; i < labels.length; i++) {
          for (let j = i + 1; j < labels.length; j++) {
            const [a, b] = [labels[i], labels[j]].sort();
            const key = `${a}|${b}`;
            coOccurCounts[key] = (coOccurCounts[key] || 0) + 1;
          }
        }
      });
  });

  // Ensure every defined category‐pair appears, even if zero
  CATEGORIES.forEach((a, i) => {
    CATEGORIES.slice(i + 1).forEach(b => {
      const key = [a, b].sort().join('|');
      if (!(key in coOccurCounts)) coOccurCounts[key] = 0;
    });
  });

  return coOccurCounts;
}
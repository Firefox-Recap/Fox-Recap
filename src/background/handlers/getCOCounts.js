import { db } from '../initdb.js';
import { CATEGORIES, MS_PER_DAY } from '../../config.js';

/**
 * Count how many times each category‑pair co‑occurred
 * in pages visited within the last `day` days.
 *
 * @async
 * @param {number} day
 *   Number of days to look back.
 * @returns {Promise<Array<[string, string, number]>>}
 *   Array of triples: [catA, catB, count].
 */
export async function getCOCounts(day) {
  const cutoff = Date.now() - day * MS_PER_DAY;

  // Pre‑fill every possible key = 0
  const coOccurCounts = Object.fromEntries(
    CATEGORIES.flatMap((a, i) =>
      CATEGORIES.slice(i + 1).map(b => {
        const [x, y] = a < b ? [a, b] : [b, a];
        return [`${x}|${y}`, 0];
      })
    )
  );

  await db.transaction('readonly', db.categories, async () => {
    await db.categories
      .where('lastVisitTime')
      .aboveOrEqual(cutoff)
      .each(({ categories }) => {
        if (!categories || categories.length < 2) return;
        const labels = categories
          .map(cat => (typeof cat === 'string' ? cat : cat?.label))
          .filter(Boolean);

        const n = labels.length;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const a = labels[i], b = labels[j];
            // Determine sorted key without .sort()
            const key = a < b ? `${a}|${b}` : `${b}|${a}`;
            coOccurCounts[key] += 1;
          }
        }
      });
  });

  // Convert to [catA, catB, count] triples
  return Object.entries(coOccurCounts).map(([key, count]) => {
    const [catA, catB] = key.split('|');
    return [catA, catB, count];
  });
}
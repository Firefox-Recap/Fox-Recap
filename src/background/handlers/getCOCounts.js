import { db, initDB } from '../initdb.js';

export async function getCOCounts(day) {
  const cutoff = Date.now() - day * 24 * 60 * 60 * 1000;

  const store = db.transaction('categories', 'readonly')
                  .objectStore('categories');
  const all = await new Promise((res, rej) => {
    const req = store.getAll();
    req.onerror = () => rej(req.error);
    req.onsuccess = () => res(req.result);
  });

  const coOccurCounts = {};

  all
    .filter(entry => entry.lastVisitTime >= cutoff)
    .forEach(({ categories }) => {
      const labels = (categories || [])
        .map(cat => typeof cat === 'string' ? cat : cat?.label)
        .filter(Boolean);

      // count each pair of labels
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const [a, b] = [labels[i], labels[j]].sort();
          const key = `${a}|${b}`;
          coOccurCounts[key] = (coOccurCounts[key] || 0) + 1;
        }
      }
    });

  return coOccurCounts;
}
import { db, initDB } from '../initdb.js';

export async function getLabelCounts(day) {
  await initDB();

  const cutoff = Date.now() - day * 24 * 60 * 60 * 1000;
  const store = db.transaction('categories', 'readonly')
                  .objectStore('categories');
  const all = await new Promise((res, rej) => {
    const req = store.getAll();
    req.onerror = () => rej(req.error);
    req.onsuccess = () => res(req.result);
  });

  const labelCounts = {};

  // only include entries within the last `day` days
  all
    .filter(entry => entry.lastVisitTime >= cutoff)
    .forEach(({ categories }) => {
      const labels = (categories || [])
        .map(cat => typeof cat === 'string' ? cat : cat?.label)
        .filter(Boolean);
      labels.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });
    });

  return Object
    .entries(labelCounts)
    .map(([label, count]) => ({ categories: [label], count }));
}
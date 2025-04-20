import { db } from '../initdb.js';
import { classifyURLAndTitle } from './ml.js';

// stores many history items in one bulk transaction
export async function storeHistoryItems(items) {
  if (!items.length) return 0;
  const toPut = items.map(i => ({
    url: i.url,
    title: i.title,
    lastVisitTime: i.lastVisitTime,
    visitCount: i.visitCount,
    typedCount: i.typedCount
  }));
  await db.transaction('rw', db.historyItems, async () => {
    await db.historyItems.bulkPut(toPut);
  });
  return toPut.length;
}

// stores many visit details in one bulk transaction
export async function storeVisitDetails(url, visits) {
  if (!visits.length) return 0;
  const toPut = visits.map(v => ({
    visitId: v.visitId,
    url,
    visitTime: v.visitTime,
    referringVisitId: v.referringVisitId,
    transition: v.transition
  }));
  await db.transaction('rw', db.visitDetails, async () => {
    await db.visitDetails.bulkPut(toPut);
  });
  return toPut.length;
}

// single‐record write—no need for manual Promise wrapping
export async function storeCategories(url, title, lastVisitTime) {
  try {
    const categories = await classifyURLAndTitle(url, title, 0.5);
    await db.transaction('rw', db.categories, async () => {
      await db.categories.put({ url, categories, lastVisitTime });
    });
  } catch (err) {
    console.error('Error classifying or storing categories:', err);
    throw err;
  }
}

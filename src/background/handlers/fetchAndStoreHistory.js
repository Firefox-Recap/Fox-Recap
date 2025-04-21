import pLimit from 'p-limit';
import { db } from '../initdb.js';
import { shouldBlockDomain } from '../services/blacklist.js';
import {
  storeHistoryItems,
} from '../services/db.js';
import { ensureEngineIsReady, classifyURLAndTitle } from '../services/ml.js';

export async function fetchAndStoreHistory(days) {
  const now = Date.now();
  const startTime = now - days * 86400e3;
  const items = await browser.history.search({ text: '', startTime, endTime: now, maxResults: 1e6 });

  const checks = await Promise.all(
    items.map(async i => ({ item: i, blocked: await shouldBlockDomain(i.url) }))
  );
  const validItems = checks.filter(r => !r.blocked).map(r => r.item);
  if (!validItems.length) return console.log('No valid history items found.');

  const keys   = validItems.map(i => [i.url, i.lastVisitTime]);
  const exists = await db.historyItems.bulkGet(keys);
  const newItems = validItems.filter((_, idx) => !exists[idx]);
  if (!newItems.length) return console.log('No new history items to store.');
  console.log(`Processing ${newItems.length} new history items…`);

  await db.transaction('rw', db.historyItems, async () => {
    await storeHistoryItems(newItems);
  });

  const threshold = 0.5;
  // startup ML engine one time up front
  await ensureEngineIsReady();

  const limit = pLimit(5);
  const tasks = newItems.map(item =>
    limit(async () => {
      const visits    = await browser.history.getVisits({ url: item.url });
      const categories = await classifyURLAndTitle(item.url, item.title ?? '', threshold, true);
      return { item, visits, categories };
    })
  );
  const results = await Promise.allSettled(tasks);

  const visitDetailsBulk = [];
  const categoriesBulk = [];
  for (const res of results) {
    if (res.status === 'fulfilled') {
      const { item, visits, categories } = res.value;
      for (const v of visits) {
        visitDetailsBulk.push({
          visitId:            v.visitId,
          url:                item.url,
          visitTime:          v.visitTime,
          referringVisitId:   v.referringVisitId,
          transition:         v.transition,
        });
      }
      categoriesBulk.push({
        url:           item.url,
        categories,
        lastVisitTime: item.lastVisitTime,
      });
    } else {
      console.error('Error processing item:', res.reason);
    }
  }

  await db.transaction('rw', db.visitDetails, db.categories, async () => {
    if (visitDetailsBulk.length) await db.visitDetails.bulkPut(visitDetailsBulk);
    if (categoriesBulk.length)  await db.categories.bulkPut(categoriesBulk);
  });

  console.log(`Completed processing ${newItems.length} new history items`);
  return newItems.length;
}

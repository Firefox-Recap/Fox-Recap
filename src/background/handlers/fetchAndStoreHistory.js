import pLimit from 'p-limit';
import { db } from '../initdb.js';
import { shouldBlockDomain } from '../services/blacklist.js';
import {
  storeHistoryItems,
  storeVisitDetails,
} from '../services/db.js';
import { classifyURLAndTitle } from '../services/ml.js';

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

  // 3) fetch & store visits + categories in parallel
  const limit = pLimit(5);
  const tasks = newItems.map((item) =>
    limit(async () => {
      try {
        const visits = await browser.history.getVisits({ url: item.url });
        await storeVisitDetails(item.url, visits);

        const title = item.title ?? '';
        const categories = await classifyURLAndTitle(item.url, title, threshold);

        await db.transaction('rw', db.categories, () => {
          return db.categories.put({
            url: item.url,
            categories,
            lastVisitTime: item.lastVisitTime
          });
        });
      } catch (err) {
        console.error(`Error processing ${item.url}:`, err);
      }
    })
  );
  await Promise.all(tasks);
  console.log(`Completed processing ${newItems.length} new history items`);
  return newItems.length;  
}

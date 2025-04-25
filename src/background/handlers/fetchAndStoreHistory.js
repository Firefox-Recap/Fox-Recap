import pLimit from 'p-limit';
import { db } from '../initdb.js';
import { shouldBlockDomain } from '../services/blacklist.js';
import { ensureEngineIsReady, classifyURLAndTitle } from '../services/ml.js';
import { MS_PER_DAY, THRESHOLD } from '../../config.js';
import { getConcurrencyLimit } from '../../util.js';

export async function fetchAndStoreHistory(days) {
  const endTime   = Date.now();
  const startTime = endTime - days * MS_PER_DAY;

  // grab all history, filter blocked
  const raw = await browser.history.search({
    text: '', startTime, endTime, maxResults: 1e6
  });
  const valid = [];
  for (const i of raw) {
    if (!(await shouldBlockDomain(i.url))) valid.push(i);
  }
  if (!valid.length) return console.debug('No valid history items found.');

  // dedupe by [url + lastVisitTime]
  // 1) de‑dupe against historyItems
  const histKeys = valid.map(i => [i.url, i.lastVisitTime]);
  const histExists = await db.historyItems.bulkGet(histKeys);

  // 2) de‑dupe against categories (only classify once)
  const catKeys = valid.map(i => i.url);
  const catExists = await db.categories.bulkGet(catKeys);

  // 3) only keep ones missing in _both_ tables
  const fresh = valid.filter((_, idx) => !histExists[idx] && !catExists[idx]);
  if (!fresh.length) 
    return console.debug('No new history items to store.');

  // ensure ML engine only once
  await ensureEngineIsReady();
  const limit       = pLimit(getConcurrencyLimit());
  const tasks       = fresh.map(item => limit(async () => {
    const visits = await browser.history.getVisits({ url: item.url });
    let categories;
    try {
      // this will first check your ML cache, then run the engine if needed
      categories = await classifyURLAndTitle(item.url, item.title ?? '', THRESHOLD, true);
    } catch (e) {
      console.error('ML classification failed for', item.url, e);
      categories = [{ label: 'Uncategorized', score: 1 }];
    }
    return { item, visits, categories };
  }));
  const results     = await Promise.allSettled(tasks);

  // batch up writes
  const histBulk    = [];
  const visitsBulk  = [];
  const catBulk     = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { item, visits, categories } = r.value;
      // historyItems
      histBulk.push({
        url: item.url,
        title: item.title,
        lastVisitTime: item.lastVisitTime,
        visitCount: item.visitCount,
        typedCount: item.typedCount
      });
      // visitDetails
      for (const v of visits) {
        visitsBulk.push({
          visitId: v.visitId,
          url: item.url,
          visitTime: v.visitTime,
          referringVisitId: v.referringVisitId,
          transition: v.transition
        });
      }
      // categories
      catBulk.push({
        url: item.url,
        categories,
        lastVisitTime: item.lastVisitTime
      });
    } else {
      console.error('History item failed:', r.reason);
    }
  }

  // one atomic transaction over all three tables
  await db.transaction(
    'rw',
    db.historyItems,
    db.visitDetails,
    db.categories,
    async () => {
      if (histBulk.length)   await db.historyItems.bulkPut(histBulk);
      if (visitsBulk.length) await db.visitDetails.bulkPut(visitsBulk);
      if (catBulk.length)    await db.categories.bulkPut(catBulk);
    }
  );

  console.debug(`Processed ${histBulk.length} new history items`);
  return histBulk.length;
}

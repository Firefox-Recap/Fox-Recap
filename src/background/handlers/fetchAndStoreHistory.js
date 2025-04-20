import { db } from '../initdb.js';
import { shouldBlockDomain } from '../services/blacklist.js';
import {
  storeHistoryItems,
  storeVisitDetails,
  storeCategories,
} from '../services/db.js';

export async function fetchAndStoreHistory(days) {
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  const endTime = now;

  const items = await browser.history.search({
    text: '',
    startTime,
    endTime,
    maxResults: 999999,
  });

  // filter out blocked domains
  const validItems = [];
  for (const item of items) {
    if (!(await shouldBlockDomain(item.url))) {
      validItems.push(item);
    }
  }
  if (!validItems.length) {
    console.log('No valid history items found to process.');
    return;
  }

  // fetch already-stored historyItems and build a lookup set // this is actually pretty inefficient, but
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction('historyItems', 'readonly');
    const store = tx.objectStore('historyItems');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
  const seen = new Set(existing.map(e => `${e.url}|${e.lastVisitTime}`));

  // only keep brand-new items
  const newItems = validItems.filter(
    (item) => !seen.has(`${item.url}|${item.lastVisitTime}`)
  );
  if (!newItems.length) {
    console.log('No new history items to store.');
    return;
  }
  console.log(`Processing ${newItems.length} new history items…`);

  // store only the new items
  await storeHistoryItems(newItems);

  // then store visits + categories for them
  for (const item of newItems) {
    try {
      const visits = await browser.history.getVisits({ url: item.url });
      await storeVisitDetails(item.url, visits);
      // pass the timestamp along
      await storeCategories(item.url, item.title, item.lastVisitTime);
    } catch (error) {
      console.error(`Error processing item ${item.url}:`, error);
    }
  }
}

import { db } from './db.js';
import { extractDomain } from './util.js';
import { shouldBlockDomain } from './blacklist.js';
import { classifyURLAndTitle, THRESHOLD } from './ml.js';
import { getCategoryFromDB, saveCategories } from './db.js';

const historyCache = {};

/** Classify & save categories only if none exist yet */
async function classifyIfNeeded(url, title) {
  const existing = await getCategoryFromDB(url);
  if (!existing) {
    const result = await classifyURLAndTitle(url, title);
    if (result) {
      const labels = result
        .filter(r => r.score >= THRESHOLD)
        .map(r => r.label);
      await saveCategories(url, labels.length ? labels : ['Uncategorized']);
    }
  }
}

/**
 * Read every saved categories entry,
 * count how many times each label appears,
 * return top N.
 */
export async function getTopCategoriesFromDB(days = 30, limit = 10) {
  // (days param is optional – you could filter by timestamp if you store it)
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result; // [{ url, categories:[{label,score},…] },…]
      const counts = all.reduce((acc, rec) => {
        rec.categories.forEach(c => {
          acc[c.label] = (acc[c.label] || 0) + 1;
        });
        return acc;
      }, {});
      const top = Object.entries(counts)
        .sort(([,a],[,b]) => b - a)
        .slice(0, limit)
        .map(([category, count]) => ({ category, count }));
      resolve(top);
    };
    req.onerror = e => reject(e.target.error);
  });
}



// Function to store history items in the database from the history api
async function storeHistoryItems(items) {
  const toStore = items.filter(item => !shouldBlockDomain(item.url));
  if (!toStore.length) return 0;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['historyItems'], 'readwrite');
    const store = tx.objectStore('historyItems');
    let successCount = 0;

    toStore.forEach(item => {
      const req = store.put({
        url: item.url,
        title: item.title,
        lastVisitTime: item.lastVisitTime,
        visitCount: item.visitCount,
        typedCount: item.typedCount,
        domain: extractDomain(item.url),
      });

      req.onsuccess = async () => {
        successCount++;
        try {
          // centralized classification
          await classifyIfNeeded(item.url, item.title);
        } catch (err) {
          console.error('Classification error:', err);
        }
        if (successCount === toStore.length) resolve(successCount);
      };

      req.onerror = e => console.error('Error storing history item:', e.target.error);
    });

    tx.onerror = e => reject(e.target.error);
  });
}

// Function to store visit details in the database according to the url that it gets
async function storeVisitDetails(url, visits) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['visitDetails'], 'readwrite');
    const visitsStore = transaction.objectStore('visitDetails');

    let successCount = 0;

    visits.forEach((visit) => {
      const request = visitsStore.put({
        visitId: visit.visitId,
        url: url,
        visitTime: visit.visitTime,
        referringVisitId: visit.referringVisitId,
        transition: visit.transition,
      });

      request.onsuccess = () => {
        successCount++;
        if (successCount === visits.length) {
          resolve(successCount);
        }
      };

      request.onerror = (event) => {
        console.error('Error storing visit details:', event.target.error);
      };
    });

    transaction.oncomplete = () => {
      // console.log(`Stored ${successCount} visit details for ${url}`);
    };

    transaction.onerror = (event) => {
      console.error('Transaction error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Function to fetch history from the API, classify, and store in DB
async function fetchAndStoreHistory(days = 30) {
  // pull raw history once
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const items = await browser.history.search({
    text: '',
    startTime,
    maxResults: 999999,
  });
  // store raw + visits
  await storeHistoryItems(items);

  for (const item of items) {
    // store visitDetails
    const visits = await browser.history.getVisits({ url: item.url });
    await storeVisitDetails(item.url, visits);
  }

  console.log(`fetchAndStoreHistory(${days}) complete`);
}

// Modified getHistoryFromDB to include timing information based on the ajusted timestamp
async function _getHistoryFromDB(days) {
  const startTime = performance.now();
  const startDbTime = performance.now();
  const stats = {dbTime: 0, apiTime: 0, fromCache: true};
  let fromCache = true;

  const startTimeMs = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    // Try to get from IndexedDB first s
    const transaction = db.transaction(['historyItems'], 'readonly');
    const historyStore = transaction.objectStore('historyItems');
    const index = historyStore.index('lastVisitTime');

    const range = IDBKeyRange.lowerBound(startTimeMs);
    const requestPromise = new Promise((resolve, reject) => {
      const request = index.getAll(range);

      request.onsuccess = () => {
        const dbEndTime = performance.now();
        stats.dbTime = (dbEndTime - startDbTime) / 1000;
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('Error getting history from DB:', event.target.error);
        reject(event.target.error);
      };
    });

    let results = await requestPromise;

    // If no results or incomplete data, fetch from API accounts for the fact if we dont have it stored in the database
    if (!results || results.length === 0) {
      fromCache = false;
      const apiStartTime = performance.now();

      // Get from Firefox History API
      const historyItems = await browser.history.search({
        text: '',
        startTime: startTimeMs,
        maxResults: 999999,
      });

      // Store for next time
      await storeHistoryItems(historyItems);

      // Get visit details for each URL
      for (const item of historyItems) {
        const visits = await browser.history.getVisits({url: item.url});
        await storeVisitDetails(item.url, visits);
      }

      results = historyItems;
      const apiEndTime = performance.now();
      stats.apiTime = (apiEndTime - apiStartTime) / 1000;
    }

    stats.fromCache = fromCache;
    const endTime = performance.now();

    // Fetch all visitDetails to compute duration
    const visitDetailsTx = db.transaction(['visitDetails'], 'readonly');
    const visitStore = visitDetailsTx.objectStore('visitDetails');
    const visitIndex = visitStore.index('visitTime');
    const visitReq = visitIndex.getAll(IDBKeyRange.lowerBound(startTimeMs));
    const visits = await new Promise((resolve, reject) => {
      visitReq.onsuccess = () => resolve(visitReq.result);
      visitReq.onerror = e => reject(e.target.error);
    });

    const browsingDuration = estimateBrowsingDuration(visits);

    return {
      data: results,
      stats: stats,
      totalTime: (endTime - startTime) / 1000,
      duration: browsingDuration, // ⬅️ this is your new stat
    };
  } catch (error) {
    console.error('Error in getHistoryFromDB:', error);
    throw error;
  }
}

export async function getHistoryFromDB(days) {
  if (historyCache[days]) return historyCache[days];
  const result = await _getHistoryFromDB(days);
  historyCache[days] = result;
  return result;
}

function estimateBrowsingDuration(visits) {
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  const sorted = visits
    .map(v => v.visitTime)
    .sort((a, b) => a - b);

  let duration = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap < SESSION_TIMEOUT_MS) {
      duration += gap;
    }
  }
  return duration / 1000; // return in seconds
}

// Similarly modify getMostVisitedFromDB to include timing metrics
async function getMostVisitedFromDB(days, limit = 5) {
  const startTime = performance.now();
  const startDbTime = performance.now();
  const stats = {dbTime: 0, apiTime: 0, fromCache: true};
  let fromCache = true;

  const startTimeMs = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    // Try to get from DB first
    const transaction = db.transaction(['visitDetails'], 'readonly');
    const visitsStore = transaction.objectStore('visitDetails');
    const index = visitsStore.index('visitTime');

    const range = IDBKeyRange.lowerBound(startTimeMs);

    const requestPromise = new Promise((resolve, reject) => {
      const request = index.getAll(range);

      request.onsuccess = () => {
        const dbEndTime = performance.now();
        stats.dbTime = (dbEndTime - startDbTime) / 1000;
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });

    let visits = await requestPromise;

    // If no results, fetch from API
    if (!visits || visits.length === 0) {
      fromCache = false;
      const apiStartTime = performance.now();

      // Get from Firefox History API
      const historyItems = await browser.history.search({
        text: '',
        startTime: startTimeMs,
        maxResults: 999999,
      });

      // Process each item
      visits = [];
      for (const item of historyItems) {
        const itemVisits = await browser.history.getVisits({url: item.url});
        visits.push(...itemVisits.map((v) => ({...v, url: item.url})));

        // Store for next time
        await storeHistoryItems([item]);
        await storeVisitDetails(item.url, itemVisits);
      }

      const apiEndTime = performance.now();
      stats.apiTime = (apiEndTime - apiStartTime) / 1000;
    }

    // Process the visits into domain counts
    const domainCounts = new Map();

    visits.forEach((visit) => {
      try {
        const domain = extractDomain(visit.url);
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      } catch (error) {
        console.error('Error processing URL:', visit.url, error);
      }
    });

    // Format and sort results
    const sortedDomains = Array.from(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map((item) => ({url: item[0], count: item[1]}));

    stats.fromCache = fromCache;
    const endTime = performance.now();

    return {
      data: sortedDomains,
      stats: stats,
      totalTime: (endTime - startTime) / 1000,
    };
  } catch (error) {
    console.error('Error in getMostVisitedFromDB:', error);
    throw error;
  }
}

// Similarly modify getVisitDetailsFromDB
async function getVisitDetailsFromDB(url) {
  const startTime = performance.now();
  const startDbTime = performance.now();
  const stats = {dbTime: 0, apiTime: 0, fromCache: true};
  let fromCache = true;

  try {
    // Try to get from DB first
    const transaction = db.transaction(['visitDetails'], 'readonly');
    const visitsStore = transaction.objectStore('visitDetails');
    const index = visitsStore.index('url');

    const requestPromise = new Promise((resolve, reject) => {
      const request = index.getAll(url);

      request.onsuccess = () => {
        const dbEndTime = performance.now();
        stats.dbTime = (dbEndTime - startDbTime) / 1000;
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error(
          'Error getting visit details from DB:',
          event.target.error,
        );
        reject(event.target.error);
      };
    });

    let results = await requestPromise;

    // If no results, fetch from API
    if (!results || results.length === 0) {
      fromCache = false;
      const apiStartTime = performance.now();

      // Get from Firefox History API
      const visits = await browser.history.getVisits({url: url});

      // Store for next time
      await storeVisitDetails(url, visits);

      results = visits;
      const apiEndTime = performance.now();
      stats.apiTime = (apiEndTime - apiStartTime) / 1000;
    }

    stats.fromCache = fromCache;
    const endTime = performance.now();

    return {
      data: results,
      stats: stats,
      totalTime: (endTime - startTime) / 1000,
    };
  } catch (error) {
    console.error('Error in getVisitDetailsFromDB:', error);
    throw error;
  }
}

export {
  storeHistoryItems,
  storeVisitDetails,
  fetchAndStoreHistory,
  getVisitDetailsFromDB,
  getMostVisitedFromDB,
};

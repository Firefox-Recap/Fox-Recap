import { db } from './db.js';
import { extractDomain } from './util.js';
import { shouldBlockDomain } from './blacklist.js';
import { saveCategories } from './db.js';
import { classifyURLAndTitle, THRESHOLD } from './ml.js';

// Function to store history items in the database from the history api
async function storeHistoryItems(items) {
  const toStore = items.filter((item) => !shouldBlockDomain(item.url));
  if (toStore.length === 0) {
    console.log(`[datahandlers] No items to store after blacklist filter`);
    return 0;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['historyItems'], 'readwrite');
    const historyStore = transaction.objectStore('historyItems');
    let successCount = 0;

    toStore.forEach((item) => {
      const request = historyStore.put({
        url: item.url,
        title: item.title,
        lastVisitTime: item.lastVisitTime,
        visitCount: item.visitCount,
        typedCount: item.typedCount,
        domain: extractDomain(item.url),
      });

      request.onsuccess = () => {
        successCount++;
        if (successCount === toStore.length) {
          resolve(successCount);
        }
      };

      request.onerror = (event) => {
        console.error('Error storing history item:', event.target.error);
      };
    });

    transaction.oncomplete = () => {
      console.log(`Stored ${successCount} history items`);
    };
    transaction.onerror = (event) => {
      console.error('Transaction error:', event.target.error);
      reject(event.target.error);
    };
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
      console.log(`Stored ${successCount} visit details for ${url}`);
    };

    transaction.onerror = (event) => {
      console.error('Transaction error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Function to fetch history from the API, classify, and store in DB
export async function fetchAndStoreHistory(days = 30) {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    const historyItems = await browser.history.search({
      text: '',
      startTime,
      maxResults: 999999,
    });
    await storeHistoryItems(historyItems);

    for (const item of historyItems) {
      // 1) store visit details
      const visits = await browser.history.getVisits({ url: item.url });
      await storeVisitDetails(item.url, visits);

      // 2) classify + filter by THRESHOLD
      const result = await classifyURLAndTitle(item.url, item.title, /* no tab */);
      if (result) {
        const labels = result
          .filter(r => r.score >= THRESHOLD)
          .map(r => r.label);
        // 3) save into IndexedDB
        await saveCategories(item.url, labels);
      }
    }

    console.log(
      `Successfully fetched, classified & stored history for ${days} days`
    );
  } catch (error) {
    console.error('Error fetching/storing/classifying history:', error);
  }
}

// Modified getHistoryFromDB to include timing information based on the ajusted timestamp
async function getHistoryFromDB(days) {
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

    return {
      data: results,
      stats: stats,
      totalTime: (endTime - startTime) / 1000,
    };
  } catch (error) {
    console.error('Error in getHistoryFromDB:', error);
    throw error;
  }
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

// Store category for a URL
async function storeCategory(url, category) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories'], 'readwrite');
    const categoriesStore = transaction.objectStore('categories');

    const request = categoriesStore.put({
      url: url,
      category: category,
    });

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Get category for a URL
async function getCategoryFromDB(url) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories'], 'readonly');
    const categoriesStore = transaction.objectStore('categories');

    const request = categoriesStore.get(url);

    request.onsuccess = () => {
      resolve(request.result ? request.result.category : null);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export {
  storeHistoryItems,
  storeVisitDetails,
  getHistoryFromDB,
  getVisitDetailsFromDB,
  getMostVisitedFromDB,
};

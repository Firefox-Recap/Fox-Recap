import {initDB} from './db.js';
import {
  fetchAndStoreHistory,
  getHistoryFromDB,
  getVisitDetailsFromDB,
  getMostVisitedFromDB,
  storeHistoryItems,
  storeVisitDetails,
  getTopCategoriesFromDB
} from './datahandlers.js';
import { classifyURLAndTitle, THRESHOLD, ensureEngineIsReady } from './ml.js';
import { getCategoryFromDB } from './db.js';

(async () => {
  try {
    await initDB();
    console.log('IndexedDB initialized');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
  }
})();

// util function
function isValidURL(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// listeners
// Listen for new history items and add them to the database
browser.history.onVisited.addListener(async (historyItem) => {
  try {
    await storeHistoryItems([historyItem]);
    const visits = await browser.history.getVisits({url: historyItem.url});
    await storeVisitDetails(historyItem.url, visits);

    // only classify if no existing category
    const existing = await getCategoryFromDB(historyItem.url);
    if (!existing) {
      await classifyURLAndTitle(historyItem.url, historyItem.title);
      console.log(`Classified: ${historyItem.url}`);
    }
  } catch (error) {
    console.error('Error handling history event:', error);
  }
});

// Update the message handler to return the stats
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getHistory': {
      getHistoryFromDB(message.days)
        .then((result) =>
          sendResponse({
            success: true,
            data: result.data,
            stats: {
              ...result.stats,
              totalTime: result.totalTime,
              totalDuration: result.duration 
            }
          }),
        )
        .catch((error) =>
          sendResponse({
            success: false,
            error: error.toString(),
          }),
        );
      return true; // keep channel open for async
    }
    case 'getVisits': {
      getVisitDetailsFromDB(message.url)
        .then((result) =>
          sendResponse({
            success: true,
            data: result.data,
            stats: result.stats,
          }),
        )
        .catch((error) =>
          sendResponse({
            success: false,
            error: error.toString(),
          }),
        );
      return true;
    }
    case 'getMostVisited': {
      getMostVisitedFromDB(message.days, message.limit)
        .then((result) =>
          sendResponse({
            success: true,
            data: result.data,
            stats: result.stats,
          }),
        )
        .catch((error) =>
          sendResponse({
            success: false,
            error: error.toString(),
          }),
        );
      return true;
    }
    case 'GET_TOP_VISITED_DOMAINS': {
      getMostVisitedFromDB(message.days || 30, message.limit || 10)
        .then((result) => 
          sendResponse({
            success: true,
            data: result.data
          })
        )
        .catch((error) =>
          sendResponse({
            success: false,
            error: error.toString(),
          })
        );
      return true;
    }
    case "ENABLE_ML": {
      ensureEngineIsReady()
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; 
    }
    case 'GET_RECAP_DATA': {
      const rangeMap = { day: 1, week: 7, month: 30 };
      const days = rangeMap[message.timeRange] || 1;
      (async () => {
        try {
          await fetchAndStoreHistory(days);
          const hist = await getHistoryFromDB(days);
          const top = await getMostVisitedFromDB(days, message.limit);
          sendResponse({
            success: true,
            data: {
              history: hist.data,
              topDomains: top.data,
              stats: { history: hist.stats, topDomains: top.stats }
            }
          });
        } catch (err) {
          sendResponse({ success: false, error: err.toString() });
        }
      })();
      return true;
    }
    case 'GET_TOP_CATEGORIES': {
      getTopCategoriesFromDB(message.days, message.limit)
        .then(data => sendResponse({ success: true, data }))
        .catch(err  => sendResponse({ success: false, error: err.toString() }));
      return true;
    }
  }
});

async function fetchInitialHistory() {
  console.log('Starting initial history fetch...');
  const historyVisits = await getHistoryFromDB();

  for (const visit of historyVisits) {
    const url = visit.url;
    if (!isValidURL(url)) {
      console.warn('Skipping invalid URL:', url);
      continue;
    }
    const parsed = new URL(url);
  }
}

import {initDB} from './db.js';
import {
  fetchAndStoreHistory,
  getHistoryFromDB,
  getVisitDetailsFromDB,
  getMostVisitedFromDB,
  storeHistoryItems,
  storeVisitDetails,
} from './datahandlers.js';

import { classifyURLAndTitle, THRESHOLD, ensureEngineIsReady } from './ml.js';

// Intialize the database
(async () => {
  try {
    await initDB();
    console.log('IndexedDB initialized');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
  }
})();

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
    console.log(`Updated database with new visit: ${historyItem.url}`);
  } catch (error) {
    console.error('Error handling history event:', error);
  }
});

// Update the message handler to return the stats
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getHistory') {
    getHistoryFromDB(message.days)
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
    return true; // Required for asynchronous sendResponse
  } else if (message.action === 'getVisits') {
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
  } else if (message.action === 'getMostVisited') {
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
  
  else if (message.action === 'GET_TOP_VISITED_DOMAINS') {
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

// intialization
initDB()
  .then(() => {
    console.log('Starting initial history fetch...');
    return fetchAndStoreHistory(1); // Fetch past 30 days by default
  })
  .then(() => {
    console.log('Initial history fetch completed');
  })
  .catch((error) => {
    console.error('Error during initialization:', error);
  });

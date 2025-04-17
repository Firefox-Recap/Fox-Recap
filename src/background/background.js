import {initDB} from './db.js';
import {
  fetchAndStoreHistory,
  getHistoryFromDB,
  getVisitDetailsFromDB,
  getMostVisitedFromDB,
  storeHistoryItems,
  storeVisitDetails,
} from './datahandlers.js';

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

// intialization
initDB()
  .then(() => {
    console.log('Starting initial history fetch...');
    return fetchAndStoreHistory(30); // Fetch past 30 days by default
  })
  .then(() => {
    console.log('Initial history fetch completed');
    // Add this global flag that popup.jsx checks
    window.isHistofyBackgroundReady = true;
  })
  .catch((error) => {
    console.error('Error during initialization:', error);
    // Still mark as ready even on error
    window.isHistofyBackgroundReady = true;
  });

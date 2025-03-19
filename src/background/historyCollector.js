/**
 * @file
 * This module is responsible for collecting browser history, categorizing it based on predefined rules, 
 * and saving the categorized data into an SQLite database. It ensures that the process is rate-limited 
 * and handles errors gracefully to maintain stability.
 * 
 * Dependencies:
 * - `dbReady`: Ensures the SQLite database is ready before performing operations.
 * - `saveHistory`: Saves categorized history items into the database.
 * - `getHistory`: Retrieves all stored history data from the database.
 */
import { dbReady, saveHistory, getHistory } from '../storage/sqlite.js';

const RATE_LIMIT = 2000;

const categorizeItem = (item) => {
  const url = (item.url || "").toLowerCase();
  if (url.includes('developer') || url.includes('github')) return 'Developer';
  if (url.includes('news') || url.includes('article')) return 'News';
  if (url.includes('youtube') || url.includes('video')) return 'Entertainment';
  return 'General';
};

/**
 * Collects the last 7 days of history, categorizes each, and saves to SQLite.
 */
export const collectHistory = async () => {
  try {
    // Wait for DB to be fully ready
    await dbReady;
    await browser.storage.local.set({ historyLoading: true });

    const endTime = Date.now();
    const startTime = endTime - (1000 * 60 * 60 * 24 * 7);
    const historyItems = await browser.history.search({
      text: '',
      startTime,
      endTime,
      maxResults: 100
    });

    for (const item of historyItems) {
      const categorizedItem = {
        title: item.title || '',
        url: item.url || '',
        category: categorizeItem(item),
        visitTime: item.lastVisitTime || Date.now()
      };
      // Now that db is ready, safe to call
      await saveHistory(categorizedItem);
    }

    const allData = getHistory();
    await browser.storage.local.set({
      historyData: allData,
      historyLoading: false
    });

    console.log(`✅ Collected ${historyItems.length} items, total now: ${allData.length}`);
  } catch (err) {
    console.error('❌ Error collecting history:', err);
    await browser.storage.local.set({ historyLoading: false });
  }

  setTimeout(collectHistory, RATE_LIMIT);
};

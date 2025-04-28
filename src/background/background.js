/**
 * @file background.js
 * @module background/background
 * @description
 * Entry point for the background script.  
 * - Initializes the IndexedDB via {@link module:background/initdb.initDB|initDB()}  
 * - Exposes all handler functions on the global `window` for easy manual invocation & debugging.
 */

import { initDB } from './initdb.js';
// Use named imports for handlers
import {
  fetchAndStoreHistory,
  getMostVisitedSites,
  getLabelCounts,
  getCOCounts,
  getVisitsPerHour,
  getDailyVisitCounts,
  getCategoryTrends,
  getTransitionPatterns,
  getRecencyFrequency,
  getUniqueWebsites
  // Note: getTimeSpentPerSite is not exported from handlers/index.js, remove if not needed or add it there.
} from './handlers/index.js';
import handlers from './handlers/index.js'; // Keep default import for window assignment if needed

/**
 * Initialize the extension’s database on startup.
 *
 * This IIFE calls {@link module:background/initdb.initDB|initDB}
 * and logs success or failure.
 *
 * @async
 * @function init
 * @returns {Promise<void>}
 */
(async function init() {
  try {
    await initDB();
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization failed', err);
  }
})();

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Background] Got message:", message.action);

  const { action, days, limit } = message;

  if (action === "fetchAndStoreHistory") {
    fetchAndStoreHistory(days).then(sendResponse);
    return true;
  }

  if (action === "getMostVisitedSites") {
    getMostVisitedSites(days, limit).then(sendResponse);
    return true;
  }

  if (action === "getVisitsPerHour") {
    getVisitsPerHour(days).then(sendResponse);
    return true;
  }

  if (action === "getLabelCounts") {
    getLabelCounts(days).then(sendResponse);
    return true;
  }

  // Note: getTimeSpentPerSite is not defined/imported. Commenting out or implement handler.
  // if (action === "getTimeSpentPerSite") {
  //   getTimeSpentPerSite(days, limit).then(sendResponse);
  //   return true;
  // }

  if (action === "getCategoryTrends") {
    getCategoryTrends(days).then(sendResponse);
    return true;
  }

  if (action === "getCOCounts") {
    getCOCounts(days).then(sendResponse);
    return true;
  }

  if (action === "getDailyVisitCounts") {
    getDailyVisitCounts(days).then(sendResponse);
    return true;
  }

  if (action === "getRecencyFrequency") {
    getRecencyFrequency(days, limit).then(sendResponse);
    return true;
  }

  if (action === "getTransitionPatterns") {
    getTransitionPatterns(days).then(sendResponse);
    return true;
  }

  if (action === "getUniqueWebsites") {
    getUniqueWebsites(days).then(sendResponse);
    return true;
  }

  console.warn("[Background] No handler for action:", action);
  sendResponse(null);
  return true;
});


/**
 * Expose background handler functions on the global `window` object.
 *
 * This allows you to call e.g.
 * ```
 * getMostVisitedSites(7).then(console.log)
 * ```
 * directly from the console for debugging or ad‐hoc testing.
 *
 * @type {Object.<string, Function>}
 */
Object.assign(window, handlers);

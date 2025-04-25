/**
 * @file background.js
 * @module background/background
 * @description
 * Entry point for the background script.  
 * - Initializes the IndexedDB via {@link module:background/initdb.initDB|initDB()}  
 * - Exposes all handler functions on the global `window` for easy manual invocation & debugging.
 */

import { initDB } from './initdb.js';
import handlers       from './handlers/index.js';

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
  const { action, days, limit } = message;

  if (action === "getMostVisitedSites") {
    return getMostVisitedSites(days, limit).then(sendResponse);
  }

  if (action === "getVisitsPerHour") {
    return getVisitsPerHour(days).then(sendResponse);
  }

  if (action === "getLabelCounts") {
    return getLabelCounts(days).then(sendResponse);
  }

  if (action === "getTimeSpentPerSite") {
    return getTimeSpentPerSite(days, limit).then(sendResponse);
  }

  if (action === "getCategoryTrends") {
    return getCategoryTrends(days).then(sendResponse);
  }

  if (action === "getCOCounts") {
    return getCOCounts(days).then(sendResponse);
  }

  if (action === "getDailyVisitCounts") {
    return getDailyVisitCounts(days).then(sendResponse);
  }

  if (action === "getRecencyFrequency") {
    return getRecencyFrequency(days, limit).then(sendResponse);
  }

  if (action === "getTransitionPatterns") {
    return getTransitionPatterns(days).then(sendResponse);
  }

  return false; // let other listeners run
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

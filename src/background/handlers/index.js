/**
 * @module background/handlers
 * @fileoverview Aggregates and re‑exports all background handler functions.
 */

// Import each handler
import { fetchAndStoreHistory }   from './fetchAndStoreHistory.js';
import { getMostVisitedSites }    from './getMostVisitedSites.js';
import { getLabelCounts }         from './getLabelCounts.js';
import { getCOCounts }            from './getCOCounts.js';
import { getVisitsPerHour }       from './getVisitsPerHour.js';
import { getDailyVisitCounts }    from './getDailyVisitCounts.js';
import { getCategoryTrends }      from './getCategoryTrends.js';
import { getTransitionPatterns }  from './getTransitionPatterns.js';
import { getRecencyFrequency }    from './getRecencyFrequency.js';
import { getUniqueWebsites }      from './getUniqueWebsites.js';

// Re-export for named imports
export { 
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
};

// Default export as an object
export default {
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
};
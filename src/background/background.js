import { initDB } from './initdb.js';
import { fetchAndStoreHistory } from './handlers/fetchAndStoreHistory.js';
import { getMostVisitedSites } from './handlers/getMostVisitedSites.js';
import { getLabelCounts } from './handlers/getLabelCounts.js';
import { getCOCounts } from './handlers/getCOCounts.js';
import { getVisitsPerHour } from './handlers/getVisitsPerHour.js';
import { getDailyVisitCounts } from './handlers/getDailyVisitCounts.js';
import { getCategoryTrends } from './handlers/getCatergoryTrends.js';
import { getTransitionPatterns } from './handlers/getTransitionPattern.js';
import { getTimeSpentPerSite } from './handlers/getTimeSpentPerSite.js';

(async function init() {
  try {
    await initDB();
    console.log('[background] Database initialized');
  } catch (err) {
    console.error('[background] Database initialization failed', err);
  }
})();

window.fetchAndStoreHistory = fetchAndStoreHistory;
window.getMostVisitedSites = getMostVisitedSites;
window.getTotalCategoryCount = getLabelCounts;
window.getCOCounts = getCOCounts;
window.getVisitsPerHour = getVisitsPerHour;
window.getDailyVisitCounts = getDailyVisitCounts;
window.getCategoryTrends = getCategoryTrends;
window.getTransitionPatterns = getTransitionPatterns;
window.getTimeSpentPerSite = getTimeSpentPerSite;

(async () => {
  try {
    await fetchAndStoreHistory(7);
    console.log('fetchAndStoreHistory completed');
  } catch (err) {
    console.error('fetchAndStoreHistory failed', err);
  }
})();
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
import { getRecencyFrequency } from './handlers/getRecencyFrequency.js';
import { getTypedUrlRatio } from './handlers/getTypedUrlRatio.js';

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
window.getRecencyFrequency = getRecencyFrequency;
window.getTypedUrlRatio = getTypedUrlRatio;

(async () => {
  try {
    // this has to be called otherwise we dont have a history database to look at start with 1 day then 7 then 30 this can be managed on frontend i think
    await fetchAndStoreHistory(7);
    console.log('fetchAndStoreHistory completed');
  } catch (err) {
    console.error('fetchAndStoreHistory failed', err);
  }
})();
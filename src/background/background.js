import { initDB } from './initdb.js';
import { fetchAndStoreHistory } from './handlers/fetchAndStoreHistory.js';
import { getMostVisitedSites } from './handlers/getMostVisitedSites.js';
import { getLabelCounts } from './handlers/getLabelCounts.js';
import { getCOCounts } from './handlers/getCOCounts.js';

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

(async () => {
  try {
    await fetchAndStoreHistory(1);
    console.log('fetchAndStoreHistory completed');
  } catch (err) {
    console.error('fetchAndStoreHistory failed', err);
  }
})();
// define all action names used by your background message‐handler
const ACTIONS = {
    STORE_HISTORY:     'storeHistoryItems',
    STORE_VISIT:       'storeVisitDetails',
    FETCH_AND_STORE:   'fetchAndStoreHistory',
    GET_HISTORY:       'getHistory',
    GET_VISIT_DETAILS: 'getVisitDetails',
    GET_MOST_VISITED:  'getMostVisited'
  };
  
  async function callBackground(action, payload = {}) {
    const res = await browser.runtime.sendMessage({ action, ...payload });
    if (!res.success) {
      throw new Error(res.error || `firefoxrecapSDK.${action} failed`);
    }
    return { data: res.data, stats: res.stats };
  }
  
  export default {
    storeHistoryItems(historyItems) {
      return callBackground(ACTIONS.STORE_HISTORY, { historyItems });
    },
  
    storeVisitDetails(visitDetails) {
      return callBackground(ACTIONS.STORE_VISIT, { visitDetails });
    },
  
    fetchAndStoreHistory({ days = 7, limit = 100 } = {}) {
      return callBackground(ACTIONS.FETCH_AND_STORE, { days, limit });
    },
  
    getHistory({ days = 7, limit = 999 } = {}) {
      return callBackground(ACTIONS.GET_HISTORY, { days, limit });
    },
  
    getVisitDetails({ url }) {
      return callBackground(ACTIONS.GET_VISIT_DETAILS, { url });
    },
  
    getMostVisited({ days = 7, limit = 10 } = {}) {
      return callBackground(ACTIONS.GET_MOST_VISITED, { days, limit });
    }
  };
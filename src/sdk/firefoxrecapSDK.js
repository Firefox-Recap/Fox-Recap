// define all action names used by your background message‐handler
const ACTIONS = {
    STORE_HISTORY:           'storeHistoryItems',
    STORE_VISIT:             'storeVisitDetails',
    FETCH_AND_STORE:         'fetchAndStoreHistory',
    GET_HISTORY:             'getHistory',
    GET_VISIT_DETAILS:       'getVisitDetails',
    GET_MOST_VISITED:        'getMostVisited',
    GET_VISIT_DURATIONS:     'getVisitDurations',
    GET_CATEGORY_DURATIONS:  'getCategoryDurations',
    GET_PEAK_HOURS:          'getPeakHours',
    GET_PEAK_DAYS:           'getPeakDays',
    GET_JOURNEY_EVENTS:      'getJourneyEvents',
    GET_TOP_CATEGORY:        'getTopCategory'
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
  },

  // unwrap .data for these convenience methods:
  async getVisitDurations(opts = {}) {
    const { data } = await callBackground(ACTIONS.GET_VISIT_DURATIONS, opts);
    return data;
  },

  async getCategoryDurations(opts = {}) {
    const { data } = await callBackground(ACTIONS.GET_CATEGORY_DURATIONS, opts);
    return data;
  },

  async getPeakHours(opts = {}) {
    const { data } = await callBackground(ACTIONS.GET_PEAK_HOURS, opts);
    return data;
  },

  async getPeakDays(opts = {}) {
    const { data } = await callBackground(ACTIONS.GET_PEAK_DAYS, opts);
    return data;
  },

  async getJourneyEvents(opts = {}) {
    const { data } = await callBackground(ACTIONS.GET_JOURNEY_EVENTS, opts);
    return data;
  },

  async getTopVisitedDomains(opts = {}) {
    const { data } = await callBackground(ACTIONS.GET_MOST_VISITED, opts);
    return data;
  },

  getTopCategory({ days = 7, limit = 1 } = {}) {
    return callBackground(ACTIONS.GET_TOP_CATEGORY, { days, limit });
  }
};
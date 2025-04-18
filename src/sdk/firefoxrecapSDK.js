// map timeRange → days
const timeRangeToDays = { day: 1, week: 7, month: 30 };

// cache recap per timeRange so we never refetch/classify twice
const recapCache = {};
const recapPromises = {};

/** Ensure GET_RECAP_DATA has run for this slice once */
async function ensureRecapLoaded(timeRange, limit = 10) {
  if (recapCache[timeRange]) {
    return recapCache[timeRange];
  }
  if (!recapPromises[timeRange]) {
    recapPromises[timeRange] = browser.runtime
      .sendMessage({ action: 'GET_RECAP_DATA', timeRange, limit })
      .then(resp => {
        if (!resp.success) throw new Error(resp.error || 'Failed to fetch recap data');
        recapCache[timeRange] = resp.data;
        return resp.data;
      })
      .finally(() => {
        delete recapPromises[timeRange];
      });
  }
  return recapPromises[timeRange];
}

/** Fetch full recap (history + topDomains + stats) */
export async function getRecapData(timeRange, limit = 10) {
  return ensureRecapLoaded(timeRange, limit);
}

/** Get raw history slice from IndexedDB */
export async function getHistory(timeRange) {
  await ensureRecapLoaded(timeRange);
  const days = timeRangeToDays[timeRange] || 1;
  const resp = await browser.runtime.sendMessage({
    action: 'getHistory',
    days
  });
  if (!resp.success) {
    throw new Error(resp.error || 'Failed to fetch history');
  }
  return { data: resp.data, stats: resp.stats };
}

/** Get visit details for a single URL (no recap fetch needed) */
export async function getVisitDetails(url) {
  const resp = await browser.runtime.sendMessage({
    action: 'getVisits',
    url
  });
  if (!resp.success) {
    throw new Error(resp.error || 'Failed to fetch visits');
  }
  return { data: resp.data, stats: resp.stats };
}

/** Get most-visited domains slice from IndexedDB */
export async function getMostVisited(timeRange, limit = 5) {
  await ensureRecapLoaded(timeRange);
  const days = timeRangeToDays[timeRange] || 1;
  const resp = await browser.runtime.sendMessage({
    action: 'getMostVisited',
    days,
    limit
  });
  if (!resp.success) {
    throw new Error(resp.error || 'Failed to fetch top domains');
  }
  return { data: resp.data, stats: resp.stats };
}

/** Shorthand for top domains only (no stats) */
export async function getTopVisitedDomains(timeRange, limit = 10) {
  await ensureRecapLoaded(timeRange);
  const days = timeRangeToDays[timeRange] || 1;
  const resp = await browser.runtime.sendMessage({
    action: 'GET_TOP_VISITED_DOMAINS',
    days,
    limit
  });
  if (!resp.success) {
    throw new Error(resp.error || 'Failed to fetch top domains');
  }
  return resp.data;
}

/** Get top categories slice from IndexedDB */
export async function getTopCategories(timeRange, limit = 10) {
  await ensureRecapLoaded(timeRange);
  const days = timeRangeToDays[timeRange] || 1;
  const resp = await browser.runtime.sendMessage({
    action: 'GET_TOP_CATEGORIES',
    days,
    limit
  });
  if (!resp.success) {
    throw new Error(resp.error || 'Failed to fetch top categories');
  }
  return resp.data; // [{ category, count }, …]
}

/** Enable ML in background (no change) */
export async function enableML() {
  const resp = await browser.runtime.sendMessage({ action: 'ENABLE_ML' });
  if (!resp.success) {
    throw new Error(resp.error || 'Failed to enable ML');
  }
  return resp;
}


export async function getHistory(days) {
  const resp = await browser.runtime.sendMessage({ action: 'getHistory', days });
  if (!resp.success) throw new Error(resp.error || 'Failed to fetch history');
  return { data: resp.data, stats: resp.stats };
}

export async function getVisitDetails(url) {
  const resp = await browser.runtime.sendMessage({ action: 'getVisits', url });
  if (!resp.success) throw new Error(resp.error || 'Failed to fetch visits');
  return { data: resp.data, stats: resp.stats };
}

export async function getMostVisited(days, limit = 5) {
  const resp = await browser.runtime.sendMessage({
    action: 'getMostVisited',
    days,
    limit
  });
  if (!resp.success) throw new Error(resp.error || 'Failed to fetch top domains');
  return { data: resp.data, stats: resp.stats };
}

export async function getTopVisitedDomains(days, limit = 10) {
  const resp = await browser.runtime.sendMessage({
    action: 'GET_TOP_VISITED_DOMAINS',
    days,
    limit
  });
  if (!resp.success) throw new Error(resp.error || 'Failed to fetch top domains');
  return resp.data;
}

export async function getRecapData(timeRange, limit = 10) {
  const resp = await browser.runtime.sendMessage({
    action: 'GET_RECAP_DATA',
    timeRange,
    limit
  });
  if (!resp.success) throw new Error(resp.error || 'Failed to fetch recap data');
  // ensure you return { history, topDomains, stats }
  return resp.data;
}

export async function enableML() {
  const resp = await browser.runtime.sendMessage({ action: 'ENABLE_ML' });
  if (!resp.success) throw new Error(resp.error || 'Failed to enable ML');
  return resp;
}

export async function getTopCategories(days, limit = 10) {
  const resp = await browser.runtime.sendMessage({
    action: 'GET_TOP_CATEGORIES',
    days,
    limit
  });
  if (!resp.success) throw new Error(resp.error || 'Failed to fetch top categories');
  return resp.data;  // [{ category, count }, …]
}


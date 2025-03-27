import { getAllVisits, getVisitDurations } from '../storage/indexedDB.js';
import { shouldBlockDomain } from '../storage/privacyGuard.js';
import { parse } from 'tldts';

/**
 * 🔥 Return top visited *root* domains from IndexedDB using tldts + clean filtering
 */
export async function getTopVisitedDomains(limit = 10) {
  const visits = await getAllVisits();
  const durations = await getVisitDurations();

  console.log("✅ Raw durations loaded:", durations); // 🔍 This logs duration entries

  const domainStats = {};

  for (const visit of Array.isArray(visits) ? visits : []) {
    if (!visit.url) continue;

    try {
      if (shouldBlockDomain(visit.url, visit.title)) continue;

      const rootDomain = parse(visit.url).domain;
      if (!rootDomain) continue;

      if (!domainStats[rootDomain]) {
        domainStats[rootDomain] = { visits: 0, durationMs: 0 };
      }

      domainStats[rootDomain].visits += 1;
    } catch (err) {
      console.warn("⚠️ Invalid URL (tldts):", visit.url);
    }
  }

  for (const durationEntry of Array.isArray(durations) ? durations : []) {
    const { domain, duration } = durationEntry || {};
    if (domainStats[domain]) {
      domainStats[domain].durationMs += duration || 0;
    }
  }

  return Object.entries(domainStats)
    .sort((a, b) => b[1].visits - a[1].visits) // Change this line to `b[1].durationMs - a[1].durationMs` to sort by time spent instead
    .slice(0, limit)
    .map(([domain, stats]) => ({
      domain,
      visits: stats.visits,
      durationMs: stats.durationMs,
    }));
}


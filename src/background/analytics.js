import { getAllVisits } from '../storage/indexedDB.js';
import { shouldBlockDomain } from '../storage/privacyGuard.js';
import { parse } from 'tldts';

/**
 * 🔥 Return top visited *root* domains from IndexedDB using tldts + clean filtering
 */
export async function getTopVisitedDomains(limit = 10) {
  const visits = await getAllVisits();
  const domainCounts = {};

  for (const visit of visits) {
    if (!visit.url) continue;

    try {
      // Centralized filtering logic
      if (shouldBlockDomain(visit.url, visit.title)) continue;

      const rootDomain = parse(visit.url).domain;
      if (!rootDomain) continue;

      domainCounts[rootDomain] = (domainCounts[rootDomain] || 0) + 1;
    } catch (err) {
      console.warn("⚠️ Invalid URL (tldts):", visit.url);
    }
  }

  return Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([domain, visits]) => ({ domain, visits }));
}

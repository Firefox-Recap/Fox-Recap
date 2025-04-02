import { getAllVisits, getVisitDurations } from '../storage/indexedDB.js';
import { shouldBlockDomain } from '../storage/privacyGuard.js';
import { parse } from 'tldts';

/**
 * 🔥 Return top visited *root* domains with intelligent duration formatting.
 * Format: "45 sec", "12.5 min", "1h 5m"
 */
export async function getTopVisitedDomains(limit = 10) {
  const visits = await getAllVisits();
  const durations = await getVisitDurations();

  const domainStats = {};

  // Count visits per root domain
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

  // Add up durations per root domain
  for (const { domain, duration } of Array.isArray(durations) ? durations : []) {
    const rootDomain = parse(domain)?.domain;
    if (!rootDomain || typeof duration !== "number") continue;

    if (!domainStats[rootDomain]) {
      domainStats[rootDomain] = { visits: 0, durationMs: 0 };
    }

    domainStats[rootDomain].durationMs += duration;
  }

  // Format duration for each domain
  const formatted = Object.entries(domainStats).map(([domain, stats]) => {
    const { visits, durationMs } = stats;
    const seconds = Math.floor(durationMs / 1000);

    let durationFormatted = "";
    if (seconds < 60) {
      durationFormatted = `${seconds} sec`;
    } else if (seconds < 3600) {
      const minutes = (seconds / 60).toFixed(1);
      durationFormatted = `${minutes} min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      durationFormatted = `${hours}h ${mins}m`;
    }

    return {
      domain,
      visits,
      durationMs,
      durationFormatted,
    };
  });

  // Sort by actual time spent (not just visits)
  return formatted.sort((a, b) => b.durationMs - a.durationMs).slice(0, limit);
}



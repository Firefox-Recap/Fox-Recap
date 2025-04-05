import { getAllVisits, getVisitDurations } from "../storage/indexedDB.js";
import { shouldBlockDomain } from "../storage/privacyGuard.js";
import { parse } from "tldts";

/**
 * Fetches the top visited *root* domains, sorted by total time spent,
 * then by visit count — returning real data from IndexedDB.
 */
export async function getTopVisitedDomains(limit = 10) {
  console.log("🔎 Using REAL getTopVisitedDomains now. limit:", limit);

  // 1) Gather visits (pageview events) + durations (time spent)
  const visits = await getAllVisits();
  const durations = await getVisitDurations();

  const domainStats = {};

  // 2) Count how many times we visited each root domain
  for (const visit of Array.isArray(visits) ? visits : []) {
    if (!visit.url) continue;
    if (shouldBlockDomain(visit.url, visit.title)) continue;

    try {
      const rootDomain = parse(visit.url).domain;
      if (!rootDomain) continue;

      if (!domainStats[rootDomain]) {
        domainStats[rootDomain] = { visits: 0, durationMs: 0 };
      }
      domainStats[rootDomain].visits += 1;
    } catch (err) {
      console.warn("⚠️ Invalid URL (tldts parse error):", visit.url);
    }
  }

  // 3) Sum total duration for each root domain
  for (const { domain, duration } of Array.isArray(durations) ? durations : []) {
    if (!domain || typeof duration !== "number") continue;

    try {
      // parse as "https://domain" to get a proper root domain
      const rootDomain = parse("https://" + domain)?.domain;
      if (!rootDomain) continue;

      if (!domainStats[rootDomain]) {
        domainStats[rootDomain] = { visits: 0, durationMs: 0 };
      }
      domainStats[rootDomain].durationMs += duration;
    } catch (err) {
      console.warn("⚠️ Invalid domain in duration parse:", domain);
    }
  }

  // 4) Convert stats object into an array and format durations
  const resultArray = Object.entries(domainStats).map(([domain, stats]) => {
    const { visits, durationMs } = stats;
    return {
      domain,
      visits,
      durationMs,
      durationFormatted: formatDuration(durationMs),
    };
  });

  // 5) Sort descending by duration (and optionally by visits)
  const sorted = resultArray.sort((a, b) => {
    if (b.durationMs !== a.durationMs) {
      return b.durationMs - a.durationMs;
    }
    return b.visits - a.visits;
  });

  // 6) Return top N
  const topN = sorted.slice(0, limit);
  console.log("✅ [Background] Real top visited domains:", topN);
  return topN;
}

/**
 * Helper to produce a readable string for the domain’s total time spent.
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const leftoverSec = seconds % 60;
    return `${minutes} min ${leftoverSec} sec`;
  }
  const hours = Math.floor(minutes / 60);
  const leftoverMin = minutes % 60;
  const leftoverSec = seconds % 60;
  return `${hours}h ${leftoverMin}m ${leftoverSec}s`;
}

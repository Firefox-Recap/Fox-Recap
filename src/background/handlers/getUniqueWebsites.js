import { db } from '../initdb.js';
import { parse } from 'tldts';

// This function identifies unique websites visited.

export async function getUniqueWebsites(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const uniqueDomains = new Set();

  await db.historyItems
    .where('lastVisitTime')
    .aboveOrEqual(cutoff)
    .each(({ url }) => {
      try {
        const { domain } = parse(url);
        if (domain) {
          uniqueDomains.add(domain);
        }
      } catch (err) {
        console.warn('Failed to parse URL:', url, err);
      }
    });

  return uniqueDomains.size;
}
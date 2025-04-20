import { db } from '../initdb.js';

export async function getTimeSpentPerSite(days, limit, SESSION_THRESHOLD = 30 * 60 * 1000) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    //grab all visits since cutoff
    const entries = await db.visitDetails
        .where('visitTime')
        .aboveOrEqual(cutoff)
        .toArray();

    // group & accumulate in one pass
    const stats = entries
      // ensure grouping runs on visits sorted by url & time
      .sort((a, b) => a.url.localeCompare(b.url) || a.visitTime - b.visitTime)
      .reduce((map, { url, visitTime }) => {
        let st = map.get(url);
        if (!st) {
          st = { totalTime: 0, lastTime: visitTime, sessions: 1, count: 1 };
          map.set(url, st);
          return map;
        }
        const gap = visitTime - st.lastTime;
        if (gap < SESSION_THRESHOLD) {
          st.totalTime += gap;
        } else {
          st.sessions++;
        }
        st.lastTime = visitTime;
        st.count++;
        return map;
      }, new Map());

    //build result, convert ms > minutes, sort & cap
    return Array.from(stats.entries())
      .map(([url, { totalTime, sessions, count }]) => ({
        url,
        timeSpent: Math.round(totalTime / 1000 / 60),
        visitCount: count,
        averageSessionLength:
          sessions > 0 ? Math.round((totalTime / sessions) / 1000 / 60) : 0
      }))
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, limit);
}
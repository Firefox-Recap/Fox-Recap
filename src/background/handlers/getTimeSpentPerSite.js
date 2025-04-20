import { db } from '../initdb.js';

export async function getTimeSpentPerSite(days, limit) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const tx = db.transaction('visitDetails', 'readonly');
    const index = tx.objectStore('visitDetails').index('visitTime');

    const entries = await new Promise((resolve, reject) => {
        const req = index.getAll(IDBKeyRange.lowerBound(cutoff));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    // Sort entries by URL and time
    const visitsByUrl = new Map();
    entries.forEach(visit => {
        if (!visitsByUrl.has(visit.url)) {
            visitsByUrl.set(visit.url, []);
        }
        visitsByUrl.get(visit.url).push(visit.visitTime);
    });

    // Calculate time spent per site
    const timeSpent = [];
    const SESSION_THRESHOLD = 30 * 60 * 1000; // 30 minutes

    for (const [url, times] of visitsByUrl) {
        times.sort((a, b) => a - b);
        let totalTime = 0;
        
        // Calculate session durations
        for (let i = 0; i < times.length - 1; i++) {
            const gap = times[i + 1] - times[i];
            if (gap < SESSION_THRESHOLD) {
                totalTime += gap;
            }
        }

        timeSpent.push({
            url,
            timeSpent: totalTime,
            visitCount: times.length,
            averageSessionLength: Math.round(totalTime / times.length)
        });
    }

    return timeSpent
        .sort((a, b) => b.timeSpent - a.timeSpent)
        .map(site => ({
            ...site,
            timeSpent: Math.round(site.timeSpent / 1000 / 60) // Convert to minutes
        }))
        .slice(0, limit);
}
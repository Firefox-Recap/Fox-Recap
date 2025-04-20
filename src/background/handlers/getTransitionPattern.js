import { db } from '../initdb.js';

export async function getTransitionPatterns(days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const tx = db.transaction(['visitDetails', 'categories'], 'readonly');
    const visits = tx.objectStore('visitDetails').index('visitTime');
    const categories = tx.objectStore('categories');

    // Get visit data
    const entries = await new Promise((resolve, reject) => {
        const req = visits.getAll(IDBKeyRange.lowerBound(cutoff));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    // the this shouldnt show transitions between sites that have the same domain



    // Analyze transitions between sites
    const transitions = new Map();
    let prevUrl = null;

    entries.sort((a, b) => a.visitTime - b.visitTime);
    
    for (const visit of entries) {
        if (prevUrl) {
            const prevDomain = new URL(prevUrl).hostname;
            const currDomain = new URL(visit.url).hostname;
            if (prevDomain === currDomain) {
                prevUrl = visit.url;
                continue;
            }
            const prevRoot = prevDomain.split('.')[0];
            const currRoot = currDomain.split('.')[0];
            if (prevRoot === currRoot) {
                prevUrl = visit.url;
                continue;
            }
            const key = `${prevUrl}|${visit.url}`;
            transitions.set(key, (transitions.get(key) || 0) + 1);
        }
        prevUrl = visit.url;
    }

    // Find common sequences
    const patterns = Array.from(transitions.entries())
        .map(([pair, count]) => {
            const [from, to] = pair.split('|');
            return { from, to, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
        patterns,
        summary: {
            totalTransitions: entries.length - 1,
            uniquePatterns: transitions.size,
            topPattern: patterns[0]
        }
    };
}
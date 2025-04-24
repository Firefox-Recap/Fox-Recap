import { db } from '../initdb.js';
import { MS_PER_DAY } from '../../config.js';

export async function getTransitionPatterns(days) {
    const cutoff = Date.now() - days * MS_PER_DAY;

    //fetch & sort visits in one shot via the visitTime index
    const entries = await db.visitDetails
        .where('visitTime')
        .aboveOrEqual(cutoff)
        .sortBy('visitTime');

    //build transitions, skipping same domain/root
    const transitions = new Map();
    let prevUrl = null;
    for (const { url } of entries) {
        if (prevUrl) {
            const prevDom = new URL(prevUrl).hostname;
            const currDom = new URL(url).hostname;
            const [p0] = prevDom.split('.');
            const [c0] = currDom.split('.');
            if (prevDom !== currDom && p0 !== c0) {
                const key = `${prevUrl}|${url}`;
                transitions.set(key, (transitions.get(key) || 0) + 1);
            }
        }
        prevUrl = url;
    }

    //pick top 10 patterns
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
            totalTransitions: Math.max(0, entries.length - 1),
            uniquePatterns: transitions.size,
            topPattern: patterns[0] || null
        }
    };
}
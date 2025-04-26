/**
 * @fileoverview
 * Generate transition patterns between visited URLs over a specified time window.
 * 
 * @module background/handlers/getTransitionPatterns
 */

import { db } from '../initdb.js';
import { MS_PER_DAY } from '../../config.js';

/**
 * A single transition pattern between two URLs.
 * @typedef {Object} TransitionPattern
 * @property {string} from - The source URL of the transition.
 * @property {string} to - The destination URL of the transition.
 * @property {number} count - How many times this exact transition occurred.
 */

/**
 * Summary statistics for the transition patterns.
 * @typedef {Object} TransitionSummary
 * @property {number} totalTransitions - Total number of transitions observed.
 * @property {number} uniquePatterns - Number of unique transition pairs.
 * @property {TransitionPattern|null} topPattern - The single most frequent transition, or `null` if none.
 */

/**
 * Fetch and analyze URL-to-URL transitions from visitDetails in the past `days` days.
 *
 * @async
 * @param {number} days - Look‑back window in days.
 * @returns {Promise<{
 *   patterns: TransitionPattern[],
 *   summary: TransitionSummary
 * }>} An object containing the top 10 transitions and a summary.
 */
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
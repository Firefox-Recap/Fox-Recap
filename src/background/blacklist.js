import { parse } from 'tldts';

const OISD_BLOCKLIST_URL = 'https://big.oisd.nl/domainswild';

let oisdBlocklist = new Set();
let oisdRegexList = [];
let isBlocklistLoaded = false;
let blocklistLoadPromise = null;

async function loadBlocklist() {
    if (blocklistLoadPromise) return blocklistLoadPromise;
    if (isBlocklistLoaded) return Promise.resolve({ domains: oisdBlocklist, regexes: oisdRegexList });

    blocklistLoadPromise = (async () => {
        try {
            const response = await fetch(OISD_BLOCKLIST_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            const lines = text.split('\n').map(l => l.trim());

            // Detect regex syntax dump
            const isRegexFormat = lines.some(l => l.startsWith('# Syntax: Regex'));
            if (isRegexFormat) {
                oisdRegexList = lines
                    .filter(l => l && !l.startsWith('#'))
                    .map(l => {
                        try {
                            // strip leading/trailing slash
                            const body = l.replace(/^\/|\/[gimusy]*$/g, '');
                            return new RegExp(body);
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean);
            } else {
                oisdBlocklist = new Set(
                    lines
                        .filter(l => l && !/^[#!/\s]/.test(l))
                        .map(l => l.toLowerCase().replace(/^[*.]+/g, ''))
                        .filter(l => /^[a-z0-9.-]+$/.test(l) && !/^\d+(\.\d+){3}$/.test(l))
                );
            }

            isBlocklistLoaded = true;
            return { domains: oisdBlocklist, regexes: oisdRegexList };
        } catch (err) {
            console.error('[blacklist] load failed', err);
            // reset to allow retry
            isBlocklistLoaded = false;
            oisdBlocklist.clear();
            oisdRegexList = [];
            blocklistLoadPromise = null;
            return { domains: oisdBlocklist, regexes: oisdRegexList };
        }
    })();

    return blocklistLoadPromise;
}

// kick off
loadBlocklist();

/**
 * Return true if URL’s hostname matches either the domain‐set or any OISD regex.
 */
export function shouldBlockDomain(url) {
    if (!isBlocklistLoaded && blocklistLoadPromise) {
        console.warn('[blacklist] still loading, blocking safe');
        return true;
    }
    if (!isBlocklistLoaded && !blocklistLoadPromise) {
        console.error('[blacklist] no list, blocking safe');
        return true;
    }

    try {
        const { hostname } = new URL(url);
        const host = hostname.toLowerCase();
        const { domain: root } = parse(host);

        // 1) test regex list
        for (const rx of oisdRegexList) {
            if (rx.test(host)) return true;
        }

        // 2) test exact hostname
        if (oisdBlocklist.has(host)) return true;

        // 3) test root
        if (root && root !== host && oisdBlocklist.has(root)) return true;

        // 4) test parent suffixes
        const parts = host.split('.');
        for (let i = 1; i < parts.length; i++) {
            const parent = parts.slice(i).join('.');
            if (parent === root || !parent.includes('.')) break;
            if (oisdBlocklist.has(parent)) return true;
        }

        return false;
    } catch (err) {
        console.warn('[blacklist] parse error, blocking safe', err);
        return true;
    }
}

export { loadBlocklist };
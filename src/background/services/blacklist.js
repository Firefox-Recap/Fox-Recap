//heavily ai generated this file can be optimized alot
import {parse} from 'tldts';
import {OISD_BLOCKLIST_URL} from '../../config.js';

let oisdBlocklist = new Set();
let oisdRegexList = [];
let isBlocklistLoaded = false;
let blocklistLoadPromise = null;

/**
 * Load the OISD blocklist (domains or regexes) exactly once.
 * @returns {Promise<{ domains: Set<string>, regexes: RegExp[] }>}
 */
export function loadBlocklist() {
  if (blocklistLoadPromise) {
    return blocklistLoadPromise;
  }
  if (isBlocklistLoaded) {
    return Promise.resolve({domains: oisdBlocklist, regexes: oisdRegexList});
  }

  blocklistLoadPromise = (async () => {
    try {
      const response = await fetch(OISD_BLOCKLIST_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      const lines = text.split('\n').map((l) => l.trim());

      // Detect if file is in regex format
      const isRegexFormat = lines.some((l) => l.startsWith('# Syntax: Regex'));
      if (isRegexFormat) {
        oisdRegexList = lines
          .filter((l) => l && !l.startsWith('#'))
          .map((l) => {
            try {
              // strip leading/trailing slash and flags
              const body = l.replace(/^\/|\/[gimusy]*$/g, '');
              return new RegExp(body);
            } catch {
              return null;
            }
          })
          .filter((rx) => rx);
      } else {
        oisdBlocklist = new Set(
          lines
            .filter((l) => l && !/^[#!/\s]/.test(l))
            .map((l) => l.toLowerCase().replace(/^[*.]+/, ''))
            .filter(
              (domain) =>
                /^[a-z0-9.-]+$/.test(domain) && !/^\d+(\.\d+){3}$/.test(domain),
            ),
        );
      }

      isBlocklistLoaded = true;
      return {domains: oisdBlocklist, regexes: oisdRegexList};
    } catch (err) {
      console.error('[blacklist] load failed', err);
      // Reset so we can retry later if needed
      isBlocklistLoaded = false;
      oisdBlocklist.clear();
      oisdRegexList = [];
      blocklistLoadPromise = null;
      return {domains: oisdBlocklist, regexes: oisdRegexList};
    }
  })();

  return blocklistLoadPromise;
}

// Kick off initial load
loadBlocklist();

/**
 * Return true if the given URL’s hostname is on the blocklist.
 * Waits until the list is loaded before checking.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
export async function shouldBlockDomain(url) {
  // wait for initial load (or retry) to complete
  const { domains, regexes } = await loadBlocklist();

  try {
    const { hostname } = new URL(url);
    const host = hostname.toLowerCase();
    const { domain: root } = parse(host);

    // 1) regex rules
    for (const rx of regexes) {
      if (rx.test(host)) return true;
    }

    // 2) exact host
    if (domains.has(host)) return true;

    // 3) root domain
    if (root && root !== host && domains.has(root)) return true;

    // 4) any parent suffix
    const parts = host.split('.');
    for (let i = 1; i < parts.length; i++) {
      const parent = parts.slice(i).join('.');
      if (parent === root || !parent.includes('.')) break;
      if (domains.has(parent)) return true;
    }

    return false;
  } catch (err) {
    console.warn('[blacklist] URL parse error; blocking by default', err);
    return true;
  }
}

// heavily ai generated this file can be optimized a lot
import { parse } from 'tldts';
import { OISD_BLOCKLIST_URL } from '../../config';

// Internal state
let oisdBlocklist = new Set();
let oisdRegexList = [];
let isBlocklistLoaded = false;
let blocklistLoadPromise = null;

/**
 * Load the OISD blocklist (domains) exactly once.
 * @returns {Promise<{ domains: Set<string>, regexes: RegExp[] }>}
 */
export function loadBlocklist() {
  if (blocklistLoadPromise) return blocklistLoadPromise;
  if (isBlocklistLoaded) return Promise.resolve({ domains: oisdBlocklist, regexes: oisdRegexList });

  blocklistLoadPromise = (async () => {
    try {
      const response = await fetch(OISD_BLOCKLIST_URL);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const text = await response.text();
      const lines = text.split('\n').map((l) => l.trim());

      oisdBlocklist = new Set(
        lines
          .filter((l) => l && !/^[#!/\s]/.test(l))
          .map((l) => l.toLowerCase().replace(/^[*.]+/, ''))
          .filter(
            (domain) =>
              /^[a-z0-9.-]+$/.test(domain) && !/^\d+(\.\d+){3}$/.test(domain),
          ),
      );

      isBlocklistLoaded = true;
      return { domains: oisdBlocklist, regexes: oisdRegexList };
    } catch (err) {
      console.error('[blacklist] load failed', err);
      isBlocklistLoaded = false;
      oisdBlocklist.clear();
      oisdRegexList = [];
      blocklistLoadPromise = null;
      return { domains: oisdBlocklist, regexes: oisdRegexList };
    }
  })();

  return blocklistLoadPromise;
}

// Kick off initial load in the background
loadBlocklist();

/**
 * Return true if the given URL’s hostname is on the blocklist.
 * Waits until the list is loaded before checking.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
export async function shouldBlockDomain(url) {
  const { domains, regexes } = await loadBlocklist();

  try {
    const { hostname } = new URL(url);
    const host = hostname.toLowerCase();
    const { domain: root } = parse(host);

    // 1) Match against regex rules (currently unused)
    for (const rx of regexes) {
      if (rx.test(host)) return true;
    }

    // 2) Exact hostname match
    if (domains.has(host)) return true;

    // 3) Root domain match
    if (root && root !== host && domains.has(root)) return true;

    // 4) Parent domain match
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

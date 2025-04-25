// heavily ai generated this file can be optimized a lot
import { parse } from 'tldts';

// Blocklist URLs
const OISD_BLOCKLIST_URL = 'https://big.oisd.nl/domainswild';        // General domain blocklist (plain format)
const OISD_SMALL_NSFW_URL = 'https://nsfw-small.oisd.nl';            // NSFW (small) blocklist, ABP format

// Internal state
let oisdBlocklist = new Set();       // Collected blocked domains (merged from both sources)
let oisdRegexList = [];              // Optional regex entries (not used by these lists)
let isBlocklistLoaded = false;       // Flag for one-time load
let blocklistLoadPromise = null;     // Prevent concurrent reloads

/**
 * Load the OISD blocklist (domains or regexes) exactly once.
 * @returns {Promise<{ domains: Set<string>, regexes: RegExp[] }>}
 */
export function loadBlocklist() {
  if (blocklistLoadPromise) return blocklistLoadPromise;
  if (isBlocklistLoaded) return Promise.resolve({ domains: oisdBlocklist, regexes: oisdRegexList });

  blocklistLoadPromise = (async () => {
    try {
      // Fetch both lists in parallel
      const [generalResp, nsfwResp] = await Promise.all([
        fetch(OISD_BLOCKLIST_URL),
        fetch(OISD_SMALL_NSFW_URL)
      ]);

      if (!generalResp.ok || !nsfwResp.ok) {
        throw new Error(`HTTP Error: ${generalResp.status}, ${nsfwResp.status}`);
      }

      const [generalText, nsfwText] = await Promise.all([
        generalResp.text(),
        nsfwResp.text()
      ]);

      // --- Parse GENERAL blocklist (raw domain list) ---
      const generalDomains = generalText
        .split('\n')
        .map(line => line.trim().toLowerCase().replace(/^[*.]+/, ''))
        .filter(line =>
          line &&
          !/^[#!/\s]/.test(line) &&
          /^[a-z0-9.-]+$/.test(line) &&
          !/^\d+\.\d+\.\d+\.\d+$/.test(line) // skip IPs
        );

      // --- Parse NSFW blocklist (ABP-style e.g. ||example.com^) ---
      const nsfwDomains = nsfwText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('||'))
        .map(line => line.slice(2).replace(/\^.*$/, '').toLowerCase())
        .filter(domain => /^[a-z0-9.-]+$/.test(domain));

      // Merge all domains
      oisdBlocklist = new Set([...generalDomains, ...nsfwDomains]);

      // Optionally parse regex lines if needed in future (currently unused)
      // const isRegexFormat = allLines.some((l) => l.startsWith('# Syntax: Regex'));

      isBlocklistLoaded = true;
      return { domains: oisdBlocklist, regexes: oisdRegexList };
    } catch (err) {
      console.error('[blacklist] load failed', err);
      // Reset so we can retry later if needed
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
  // Wait for blocklist to load (or retry)
  const { domains, regexes } = await loadBlocklist();

  try {
    const { hostname } = new URL(url);
    const host = hostname.toLowerCase();
    const { domain: root } = parse(host);

    // 1) Match against regex rules
    for (const rx of regexes) {
      if (rx.test(host)) return true;
    }

    // 2) Exact hostname match
    if (domains.has(host)) return true;

    // 3) Root domain match
    if (root && root !== host && domains.has(root)) return true;

    // 4) Match any parent suffix (e.g., sub.domain.example.com → example.com)
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

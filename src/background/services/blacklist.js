/**
 * @fileoverview Manages fetching, processing, and checking against domain blocklists.
 * Supports multiple blocklist sources (e.g., OISD full, OISD NSFW) and combines them.
 * Provides functionality to check if a given URL's domain should be blocked based on the loaded lists.
 */

import { parse } from 'tldts';
import {
  OISD_BLOCKLIST_URL,
  NSFW_OISD_BLOCKLIST_URL,
  BLOCKLIST_ENABLED,
  NSFW_BLOCKLIST_ENABLED
} from '../../config';

// Internal state
/**
 * Combined set of all domains from enabled blocklists.
 * @type {Set<string>}
 */
let combinedBlocklist = new Set();
/**
 * Flag indicating whether the blocklist(s) have been successfully loaded.
 * @type {boolean}
 */
let isBlocklistLoaded = false;
/**
 * Promise that resolves when the blocklist loading process is complete.
 * Used to prevent multiple concurrent load attempts.
 * @type {Promise<{ domains: Set<string> }> | null}
 */
let blocklistLoadPromise = null;

/**
 * Fetches and processes a single blocklist URL.
 * Downloads the list, parses it, filters comments/invalid lines,
 * normalizes domains, and returns a Set of valid domains.
 * @param {string} url The URL to fetch the blocklist from.
 * @returns {Promise<Set<string>>} A promise resolving to a Set of domains from the list.
 *                                  Returns an empty Set if fetching or processing fails.
 */
async function fetchAndProcessList(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} for ${url}`);
    }
    const text = await response.text();
    const lines = text.split('\n').map((l) => l.trim());

    return new Set(
      lines
        // Filter out comments, empty lines, etc.
        .filter((l) => l && !/^[#!/\s]/.test(l))
        // Normalize: lowercase, remove leading wildcards/dots
        .map((l) => l.toLowerCase().replace(/^[*.]+/, ''))
        // Filter for valid domain-like strings, excluding IPs
        .filter(
          (domain) =>
            /^[a-z0-9.-]+$/.test(domain) && !/^\d+(\.\d+){3}$/.test(domain),
        ),
    );
  } catch (err) {
    console.error(`[blacklist] Failed to load list from ${url}:`, err);
    return new Set(); // Return empty set on error for this list
  }
}


/**
 * Loads the configured blocklist(s) based on environment variables.
 * Ensures lists are fetched and processed only once.
 * Merges domains from multiple enabled lists into `combinedBlocklist`.
 * @returns {Promise<{ domains: Set<string> }>} A promise that resolves with an object containing the combined set of blocked domains.
 *                                              The promise ensures that the loading process completes before resolving.
 */
export function loadBlocklist() {
  if (blocklistLoadPromise) return blocklistLoadPromise;
  if (isBlocklistLoaded) return Promise.resolve({ domains: combinedBlocklist });

  blocklistLoadPromise = (async () => {
    const listsToFetch = [];
    if (BLOCKLIST_ENABLED) {
      listsToFetch.push(fetchAndProcessList(OISD_BLOCKLIST_URL));
    }
    if (NSFW_BLOCKLIST_ENABLED) {
      listsToFetch.push(fetchAndProcessList(NSFW_OISD_BLOCKLIST_URL));
    }

    // If no lists are enabled, resolve immediately with empty set
    if (listsToFetch.length === 0) {
      console.warn('[blacklist] No blocklists enabled.');
      isBlocklistLoaded = true;
      combinedBlocklist = new Set();
      return { domains: combinedBlocklist };
    }

    try {
      const results = await Promise.all(listsToFetch);
      // Combine all fetched sets into one
      combinedBlocklist = new Set(results.flatMap(domainSet => [...domainSet]));

      console.log(`[blacklist] Loaded ${combinedBlocklist.size} domains.`);
      isBlocklistLoaded = true;
      return { domains: combinedBlocklist };
    } catch (err) {
      // This catch might be redundant if fetchAndProcessList handles errors,
      // but kept for safety during Promise.all failure.
      console.error('[blacklist] load failed during Promise.all:', err);
      isBlocklistLoaded = false; // Reset state on major failure
      combinedBlocklist.clear();
      blocklistLoadPromise = null; // Allow retry on next call
      // Return empty set on major failure, but ensure promise resolves
      return { domains: new Set() };
    }
  })();

  return blocklistLoadPromise;
}

/**
 * Checks if the domain (or its parent domains) of a given URL is present in the loaded blocklist.
 * It ensures the blocklist is loaded before performing the check.
 * Checks exact hostname, root domain, and parent domains.
 * Logs blocked domains and the matched rule.
 * @param {string} url The URL string to check.
 * @returns {Promise<boolean>} A promise resolving to `true` if the URL's domain should be blocked, `false` otherwise.
 *                             Returns `true` if the URL is malformed and cannot be parsed.
 */
export async function shouldBlockDomain(url) {
  // Ensure the list is loaded (or load attempt finished)
  const { domains } = await loadBlocklist();

  // If loading failed or no lists enabled, domains set might be empty.
  // An empty set means nothing will be blocked.

  try {
    const { hostname } = new URL(url);
    const host = hostname.toLowerCase();
    // Use tldts to reliably get the registrable domain (root)
    const { domain: root } = parse(host);

    let isBlocked = false;
    let matchedDomain = null;

    // 1) Exact hostname match
    if (domains.has(host)) {
      isBlocked = true;
      matchedDomain = host;
    }
    // 2) Root domain match (if different from host and valid)
    else if (root && root !== host && domains.has(root)) {
      isBlocked = true;
      matchedDomain = root;
    }
    // 3) Parent domain match (check subdomains against list)
    else {
      const parts = host.split('.');
      // Iterate from the potential parent domain upwards
      // e.g., for sub.sub.example.com, check sub.example.com, then example.com
      for (let i = 1; i < parts.length - 1; i++) { // Stop before checking only TLD
        const parent = parts.slice(i).join('.');
        // Stop if we reach the root domain (already checked) or a TLD-like structure
        if (parent === root || !parent.includes('.')) break;
        if (domains.has(parent)) {
          isBlocked = true;
          matchedDomain = parent;
          break; // Found a match, no need to check further parents
        }
      }
    }

    if (isBlocked) {
      console.log(`[blacklist] Blocking URL: ${url} (matched domain: ${matchedDomain})`);
      return true;
    }

    return false; // Not found in any check
  } catch (err) {
    // This error is likely due to new URL(url) failing for malformed URLs
    console.warn('[blacklist] URL parse error; blocking by default for safety', url, err);
    return true; // Block if URL is malformed
  }
}

import {parse} from 'tldts';

const OISD_BLOCKLIST_URL = 'https://big.oisd.nl/domainswild';

let oisdBlocklist = new Set();
let isBlocklistLoaded = false;
let blocklistLoadPromise = null;
async function loadBlocklist() {
  if (blocklistLoadPromise) {
    return blocklistLoadPromise;
  }
  if (isBlocklistLoaded) {
    return Promise.resolve(oisdBlocklist);
  }

  blocklistLoadPromise = (async () => {
    try {
      console.log(
        `[blacklist] Fetching blocklist from ${OISD_BLOCKLIST_URL}...`,
      );
      const response = await fetch(OISD_BLOCKLIST_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const domains = new Set(
        text
          .split('\n')
          .map((line) => line.trim())
          // Filter out comments (common markers: #, !, /) and empty lines
          // Filter out lines that look like IP addresses or contain invalid hostname characters
          .filter(
            (line) =>
              line &&
              !/^[#!/\s]/.test(line) &&
              /^[a-z0-9.-]+$/.test(line.toLowerCase()) &&
              !/^\d{1,3}(\.\d{1,3}){3}$/.test(line),
          )
          // Basic normalization: convert to lowercase
          .map((line) => line.toLowerCase())
          // Remove potential leading wildcards/dots for simple matching
          // Note: This simplifies matching; full wildcard support needs more logic
          .map((line) => line.replace(/^[*.]+/g, ''))
          .filter(Boolean), // Filter out empty strings resulting from replacements
      );

      oisdBlocklist = domains;
      isBlocklistLoaded = true;
      console.log(
        `[blacklist] Blocklist loaded successfully. ${oisdBlocklist.size} unique domains processed.`,
      );
      // blocklistLoadPromise = null; // Keep the promise to indicate successful load
      return oisdBlocklist;
    } catch (error) {
      console.error(' [blacklist] Failed to load or process blocklist:', error);
      isBlocklistLoaded = false; // Mark as not loaded on error
      oisdBlocklist = new Set(); // Ensure it's an empty set on error
      blocklistLoadPromise = null; // Allow retrying later if needed
      // Depending on application needs, you might want to re-throw the error
      // or schedule a retry. For now, it fails silently with an empty list.
      return oisdBlocklist; // Return empty set
    }
  })();
  return blocklistLoadPromise;
}

// Initiate loading the blocklist when the module is imported.
// The shouldBlockDomain function will handle checks before the list is fully loaded.
loadBlocklist();

/**
 * ✅ Return true if a domain should be ignored based on the OISD blocklist.
 * Checks the hostname and its parent domains against the loaded list.
 */
export function shouldBlockDomain(url) {
  // If the list hasn't finished loading attempt, block by default for safety.
  // If loading failed, oisdBlocklist will be empty, effectively allowing all domains.
  // Consider if blocking is desired even if the list fetch fails permanently.
  if (!isBlocklistLoaded && blocklistLoadPromise) {
    // Still loading, block for now.
    console.warn('[blacklist] Blocklist not yet loaded. Blocking URL:', url);
    return true;
  }
  if (!isBlocklistLoaded && !blocklistLoadPromise) {
    // Loading hasn't started or failed previously. Block? Or Allow? Let's block.
    console.error(
      "[blacklist] Blocklist failed to load or hasn't started. Blocking URL:",
      url,
    );
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase(); // Normalize hostname

    // Use tldts to get the effective root domain, also normalized
    const {domain: rootDomain} = parse(hostname);

    if (!hostname) {
      console.warn('[blacklist] Could not determine hostname:', url);
      return true; // Block if hostname parsing fails
    }

    // Check exact hostname first
    if (oisdBlocklist.has(hostname)) {
      // console.log(`[privacyGuard] ⛔ Blocked hostname (OISD): ${hostname}`);
      return true;
    }

    // Check root domain if different from hostname
    if (
      rootDomain &&
      rootDomain !== hostname &&
      oisdBlocklist.has(rootDomain)
    ) {
      // console.log(`[privacyGuard] ⛔ Blocked root domain (OISD): ${rootDomain}`);
      return true;
    }

    // Check parent domains (e.g., for 'sub.ads.example.com', check 'ads.example.com')
    // This handles cases where a higher-level domain is blocked.
    const parts = hostname.split('.');
    // Start checking from the second part up to the root domain
    for (let i = 1; i < parts.length; i++) {
      const parentDomain = parts.slice(i).join('.');
      // Stop if we reach the root domain (already checked) or TLD
      if (parentDomain === rootDomain || !parentDomain.includes('.')) {
        break;
      }
      if (oisdBlocklist.has(parentDomain)) {
        // console.log(`[privacyGuard] ⛔ Blocked parent domain (OISD): ${parentDomain} (checking ${hostname})`);
        return true;
      }
    }

    // If no match found in the blocklist
    return false;
  } catch (err) {
    // Catch errors from URL constructor or tldts parse
    console.warn('[blacklist] Failed to parse URL or check domain:', url, err);
    return true; // Block on error
  }
}
export {loadBlocklist};

/**
 * @file privacyGuard.js
 * @description Central domain filtering utility to enforce clean, user-only tracking.
 */

import { parse } from 'tldts';

const blockedRootDomains = new Set([
  "doubleclick.net", "googlesyndication.com", "rubiconproject.com",
  "adsrvr.org", "indexww.com", "optimizely.com", "outbrain.com",
  "adnxs.com", "casalemedia.com", "pubmatic.com", "amazon-adsystem.com",
  "openx.net", "moatads.com", "scorecardresearch.com", "criteo.com",
  "yieldmo.com", "bidswitch.net", "demdex.net", "3lift.com", "imrworldwide.com",
  "googletagmanager.com"
]);

const suspiciousDomains = new Set([
  "typekit.net", "adobedtm.com", "fonts.googleapis.com", "adobe.com"
]);

const pixelDomains = new Set([
  "tr.snapchat.com", // redirects/pixels from Hulu, etc.
  "trk.mailchimp.com",
  "click.email.adobe.com",
  "click.cnn.com",
  "email.linkedin.com"
]);

/**
 * ✅ Return true if a domain should be ignored
 */
export function shouldBlockDomain(url, title = "") {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const { domain: rootDomain } = parse(url);

    // 🐛 STEP 2 DEBUG:
    console.log(`[privacyGuard] Checking domain. URL: ${url}, Hostname: ${hostname}, Root: ${rootDomain}, Title: ${title}`);

    if (!rootDomain || !hostname) {
      console.warn("❌ [privacyGuard] Invalid or missing root domain:", url);
      return true;
    }

    // ⛔ Pixel tracker subdomain (exact match)
    if (pixelDomains.has(hostname)) {
      console.log(`⛔ Blocked pixel domain: ${hostname}`);
      return true;
    }

    // ⛔ Root-level ad/tracker domains
    if (blockedRootDomains.has(rootDomain)) {
      return true;
    }

    // ⚠️ Suspicious domains based on title/font heuristic
    if (
      suspiciousDomains.has(rootDomain) &&
      (!title || title.toLowerCase().includes("font") || title.length < 5)
    ) {
      return true;
    }

    return false;
  } catch (err) {
    console.warn("❌ [privacyGuard] Failed to parse URL:", url);
    return true;
  }
}

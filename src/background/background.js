/**
 * @file background.js
 * @description This file serves as the core background script for the Histofy browser extension. 
 * It tracks browser history, classifies visited pages using rule-based and AI-based methods, 
 * caches results in IndexedDB, and manages user-labeled categories in SQLite. 
 * Additionally, it supports batch classification, CSV generation, and event-driven updates.
 * 
 * Key Features:
 * - Rule-based and AI-based classification of visited pages.
 * - Caching of classifications and embeddings for performance optimization.
 * - User-labeled category management with SQLite integration.
 * - Batch classification for efficient processing of multiple pages.
 * - CSV export and storage for user data.
 * - Event listeners for browser history and navigation events.
 * - In-memory SQLite database for fast access to history data.
 * - Support for manual updates and debugging via the console.
 */

import initSqlJs from "sql.js";
import { CATEGORY_OPTIONS } from "../../models/transformers.js";
import { loadModel, classifyPage, getEmbedding } from "../../models/transformers.js";
import { DOMAIN_LOCKS } from "../storage/domainLocks.js";

import {
  cacheClassification,
  getCachedClassification,
  cacheEmbedding,
  getMatchingEmbedding,
  removeAllStaleForDomain,
  updateStoredCSV,
  getStoredCSV
} from "../storage/indexedDB.js";
import {
  getUserLabel,
  setUserLabel,
  dbReady as sqliteReady
} from "../storage/sqlite.js";

// ---------------------------------------
// Global / Module-Level Variables
// ---------------------------------------
let db = null; // local in-memory DB
let dbInMemoryReady = null; // a Promise for the background's in-memory DB

const recentUrls = new Set();
const DUPLICATE_TIMEOUT_MS = 5000;
const classificationQueue = [];
let batchTimer = null;

// NEW: finalBatches object for storing "locked" batch classifications
let finalBatches = {}; 

/* --------------------------------------------------
   1) RULE-BASED CLASSIFICATION
----------------------------------------------------*/
function ruleBasedCategory(domain) {
  if (!domain) return null;
  const lowerDomain = domain.trim().toLowerCase();




  // Big categoryMap with expanded keywords:
  const categoryMap = {
    "Shopping & E-Commerce": [
      "amazon", "ebay", "etsy", "walmart", "bestbuy", "alibaba", "target",
      "costco", "shopify", "homedepot", "lowes", "wayfair", "overstock",
      "macys", "nordstrom", "ikea", "kohls", "jcpenney",
      "sephora", "ulta", "tjmaxx", "meijer", "kroger", "instacart",
      "chewy", "samsclub", "shein", "aliexpress", "flipkart",
      "newegg", "bhphotovideo", "zalando", "rakuten"
    ],
    "Technology & Development": [
      "github", "stack", "dev.to", "gitlab", "bitbucket", "hackernoon",
      "9to5mac", "gizmodo", "techcrunch", "engadget", "slashdot",
      "theverge", "wired", "venturebeat", "thenextweb", "producthunt",
      "androidauthority", "xda-developers", "arstechnica", "tomshardware",
      "digitaltrends", "redhat", "linux", "microsoft", "apple", "adobe"
    ],
    "News & Media": [
      "nytimes", "cnn", "bbc", "forbes", "huffpost", "theguardian",
      "bloomberg", "washingtonpost", "reuters", "npr",
      "wsj", "usatoday", "latimes", "foxnews", "abcnews",
      "nbcnews", "cbsnews", "time", "newsweek", "economist",
      "aljazeera", "skynews", "msnbc"
    ],
    "Social Media & Networking": [
      "facebook", "twitter", "linkedin", "instagram", "reddit",
      "tiktok", "snapchat", "discord", "pinterest", "quora",
      "nextdoor", "tumblr", "threads", "clubhouse",
      "wechat", "qq", "telegram", "vk", "line",
      "mastodon", "medium", "flickr", "periscope"
    ],
    "Entertainment & Streaming": [
      "netflix", "youtube", "spotify", "hulu", "twitch",
      "disneyplus", "hbomax", "primevideo", "peacocktv",
      "paramountplus", "crunchyroll", "appletv", "vimeo", "soundcloud",
      "pandora", "deezer", "iplayer", "funimation", "dazn",
      "audible", "bandcamp", "iheartradio"
    ],
    "Finance & Banking": [
      "bankofamerica", "wellsfargo", "chase", "paypal", "venmo",
      "stripe", "crypto", "robinhood", "fidelity", "goldmansachs",
      "pnc", "creditkarma", "etrade", "coinbase", "blockchain",
      "mortgage", "investment", "ameritrade", "ally", "charles schwab",
      "tdbank", "capitalone", "citibank", "hsbc", "bofa", "ripple",
      "moneygram", "westernunion", "transferwise", "wise"
    ],
    "Education & Learning": [
      "coursera", "udemy", "edx", "khanacademy", "mit",
      "harvard", "stanford", "pluralsight", "skillshare",
      "brilliant", "futurelearn", "codecademy", "freecodecamp",
      "udacity", "academia", "classcentral", "openuniversity",
      "berkeley", "oxford", "cambridge", "yale", "upenn",
      "edutopia", "elearning"
    ],
    "Health & Wellness": [
      "webmd", "healthline", "mayoclinic", "clevelandclinic", "medscape",
      "nhs", "who", "doctorondemand", "livestrong", "bhf",
      "hopkinsmedicine", "uclahealth", "psychologytoday", "healthgrades",
      "cvs", "walgreens", "medlineplus", "drugs", "health",
      "verywell"
    ],
    "Real Estate & Housing": [
      "zillow", "redfin", "realtor", "trulia", "homes", "apartments",
      "rent", "coldwellbanker", "remax", "century21", "housing",
      "rightmove", "zoopla", "seloger", "domain", "reali"
    ],
    "Business & Productivity": [
      "notion", "asana", "trello", "slack", "zoom",
      "monday", "zoho", "airtable", "googleworkspace",
      "office365", "salesforce", "docusign", "dropbox",
      "hubspot", "quickbooks", "xero", "freshbooks",
      "evernote", "toggl", "clickup", "basecamp", "workday",
      "sharepoint"
    ],
    "Sports & Fitness": [
      "nba", "espn", "mlb", "nfl", "fitbit",
      "foxsports", "bodybuilding", "nike", "adidas",
      "underarmour", "strava", "bleacherreport", "goal",
      "fifa", "uefa", "espncricinfo", "sportsillustrated",
      "runnersworld", "muscleandfitness"
    ],
    "Government & Politics": [
      "gov", "whitehouse", "senate", "house", "politico",
      "congress", "noaa", "loc", "defense", "europa",
      "un", "parliament", "gov.uk", "usa", "fdlp",
      "census", "uscis"
    ],
    "Automotive": [
      "carmax", "ford", "tesla", "bmw", "honda",
      "toyota", "nissan", "chevrolet", "mercedes",
      "edmunds", "kbb", "roadandtrack", "carvana", "autotrader",
      "carfax", "caranddriver", "automobilemag", "motortrend",
      "autoblog", "cars", "autozone", "advancedautoparts"
    ],
    "Gaming": [
      "steam", "playstation", "xbox", "nintendo", "epicgames",
      "ign", "gamespot", "twitch", "rockstargames", "battle",
      "roblox", "unity", "leagueoflegends", "riotgames",
      "gamestop", "ubisoft", "ea", "gamefaqs", "gog"
    ],
    "Science & Research": [
      "nature", "sciencedirect", "nasa", "arxiv", "researchgate",
      "scientificamerican", "nationalgeographic", "newscientist",
      "sciencemag", "pnas", "royalsociety", "springer",
      "jneurosci", "medrxiv", "biorxiv", "pubmed", "nih"
    ],
    "Travel & Tourism": [
      "booking", "expedia", "airbnb", "tripadvisor", "kayak",
      "lonelyplanet", "trip", "skyscanner", "travelocity",
      "marriott", "hilton", "hostelworld", "trivago", "hotels",
      "agoda", "accor", "jetblue", "southwest", "united", "delta",
      "americanairlines"
    ],
    "Ads & Trackers": [
      "doubleclick", "googletagmanager", "adsrvr", "adroll",
      "taboola", "outbrain", "quantcast", "criteo",
      "adservice", "advertising", "omtrdc", "demdex",
      "moatads", "tracking", "pixel", "google-analytics"
    ]
  };

  // Check for keywords
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => lowerDomain.includes(keyword))) {
      return category;
    }
  }

  // Regex-based fallback checks
  if (/(\.gov|senate|congress|whitehouse)/.test(lowerDomain)) return "Government & Politics";
  if (/(\.edu|university|college)/.test(lowerDomain)) return "Education & Learning";
  if (/(\.bank|financial|creditunion)/.test(lowerDomain)) return "Finance & Banking";
  if (/(\.realestate|property|homes)/.test(lowerDomain)) return "Real Estate & Housing";
  if (/(\.health|clinic|medical|hospital)/.test(lowerDomain)) return "Health & Wellness";

  // Default fallback
  return "Other";
}

/* --------------------------------------------------
   2) NORMALIZATION
----------------------------------------------------*/
function normalizeDomain(d) {
  return d.replace(/^www\./, "");
}
function normalizeUrl(u) {
  try {
    const parsed = new URL(u);
    parsed.protocol = "https:";
    parsed.hostname = normalizeDomain(parsed.hostname);
    return parsed.href;
  } catch {
    return u;
  }
}

/* --------------------------------------------------
   3) Zero-Shot AI Classification Fallback
----------------------------------------------------*/
async function classifyWithAI(domain, title) {
  console.log(`🤖 AI Classifying: ${domain}`);
  await loadModel(); // ensure the AI model is ready

  const textForClassification = `${title} (Domain: ${domain})`;
  const zeroShotCategory = await classifyPage(textForClassification);
  return zeroShotCategory || "Other";
}

/* --------------------------------------------------
   4) CLASSIFY WITH CACHE (Rule-Based + AI)
----------------------------------------------------*/
export async function classifyWithCache(url, title) {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    console.warn("❗ Could not parse domain. Using title only.");
  }

  await sqliteReady; // Ensure SQLite is ready
  const rootDomain = domain.split(".").slice(-2).join(".");

  /* --------------------------------------------------
     1) PRIORITY CHECK: DOMAIN LOCKS (HIGHEST PRIORITY)
  ----------------------------------------------------*/
  if (DOMAIN_LOCKS[rootDomain]) {
    console.log(`🛑 Domain Lock Applied: ${rootDomain} → ${DOMAIN_LOCKS[rootDomain]}`);
    await cacheClassification(title, DOMAIN_LOCKS[rootDomain]);
    return DOMAIN_LOCKS[rootDomain];
  }

  /* --------------------------------------------------
     2) CHECK FINAL BATCH CLASSIFICATIONS
  ----------------------------------------------------*/
  if (finalBatches[rootDomain]) {
    console.log(`🛑 Batch Lock Applied: ${rootDomain} → ${finalBatches[rootDomain]}`);
    await cacheClassification(title, finalBatches[rootDomain]);
    return finalBatches[rootDomain];
  }

  /* --------------------------------------------------
     3) CHECK USER-LABELED CATEGORIES (FROM SQLite)
  ----------------------------------------------------*/
  const userCategory = getUserLabel(rootDomain);
  if (userCategory && userCategory !== "Unknown") {
    console.log(`👤 Using stored user-labeled category for ${rootDomain}: ${userCategory}`);
    await cacheClassification(title, userCategory);
    return userCategory;
  }

  /* --------------------------------------------------
     4) RULE-BASED CLASSIFICATION
  ----------------------------------------------------*/
  const ruleCategory = ruleBasedCategory(domain);
  if (ruleCategory && ruleCategory !== "Other") {
    console.log(`⚡ Rule-based classification: ${domain} -> ${ruleCategory}`);
    await cacheClassification(title, ruleCategory);
    return ruleCategory;
  }

  /* --------------------------------------------------
     5) RETRIEVE CACHED CLASSIFICATIONS (IndexedDB)
  ----------------------------------------------------*/
  const textForClassification = `${title} (Domain: ${domain})`;
  const cachedCategory = await getCachedClassification(rootDomain, title);

  if (cachedCategory) {
    console.log(`🔄 Using Cached Classification: ${domain}, ${title} → ${cachedCategory}`);
    return cachedCategory;
  }

  /* --------------------------------------------------
     6) CHECK CACHED EMBEDDINGS (SIMILAR TEXT CLASSIFICATION)
  ----------------------------------------------------*/
  const embedding = await getEmbedding(textForClassification);
  const matchedEmbeddingCategory = await getMatchingEmbedding(embedding);

  if (matchedEmbeddingCategory) {
    console.log(`🔄 Using Cached Embedding Classification for "${title}": ${matchedEmbeddingCategory}`);
    return matchedEmbeddingCategory;
  }

  /* --------------------------------------------------
     7) AI FALLBACK CLASSIFICATION (Zero-Shot Model)
  ----------------------------------------------------*/
  console.log(`🤖 AI Fallback Triggered for: ${title}`);
  const zeroShotCategory = await classifyWithAI(domain, title);
  console.log(`🤖 AI Classified: "${title}" -> ${zeroShotCategory}`);

  /* --------------------------------------------------
     8) FINAL CATEGORY DETERMINATION & CACHE RESULTS
  ----------------------------------------------------*/
  const finalCategory = zeroShotCategory && CATEGORY_OPTIONS.includes(zeroShotCategory)
    ? zeroShotCategory
    : "Other"; // Default fallback category

  // Store embeddings & classification in IndexedDB for future lookups
  await cacheEmbedding(textForClassification, embedding, finalCategory);
  await cacheClassification(title, finalCategory);

  return finalCategory;
}


/* --------------------------------------------------
   5) BATCH CLASSIFICATION
----------------------------------------------------*/
function queueClassification(url, title) {
  if (classificationQueue.some(item => item.url === url)) return;
  classificationQueue.push({ url, title });
  if (!batchTimer) {
    batchTimer = setTimeout(processBatchClassification, 5000);
  }
}

async function processBatchClassification() {
  if (classificationQueue.length === 0) {
    batchTimer = null;
    return;
  }
  await loadModel();
  console.log(`🚀 Batch classifying ${classificationQueue.length} pages...`);

  for (const { url, title } of classificationQueue) {
    const category = await classifyWithCache(url, title);
    await saveHistory(url, title, category);
  }
  classificationQueue.length = 0;
  batchTimer = null;
}

/* --------------------------------------------------
   6) IN-MEMORY DB SETUP
----------------------------------------------------*/
async function loadDatabase() {
  const SQL = await initSqlJs({
    locateFile: () => browser.runtime.getURL("assets/sql-wasm.wasm"),
  });
  db = new SQL.Database();
  console.log("✅ Background in-memory DB init success!");

  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE,
      title TEXT,
      category TEXT,
      visitCount INTEGER DEFAULT 0
    );
  `);
}

/* --------------------------------------------------
   7) SAVE HISTORY
----------------------------------------------------*/
async function saveHistory(url, title, category) {
  await dbInMemoryReady; // Wait for our in-memory DB to be ready
  if (!db) {
    console.error("❌ In-memory DB not initialized. Cannot save history.");
    return;
  }

  const normalizedUrl = normalizeUrl(url);
  if (recentUrls.has(normalizedUrl)) {
    console.log(`🔄 Skipping duplicate: ${normalizedUrl}`);
    return;
  }
  recentUrls.add(normalizedUrl);
  setTimeout(() => recentUrls.delete(normalizedUrl), DUPLICATE_TIMEOUT_MS);

  // Also store classification in IndexedDB's 'classifications' store
  await cacheClassification(title, category);

  try {
    const stmt = db.prepare(`
      INSERT INTO history (url, title, category, visitCount)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(url) DO UPDATE
        SET visitCount = visitCount + 1,
            category = excluded.category;
    `);
    stmt.run([normalizedUrl, title, category]);
    stmt.free();

    // Mirror to local storage for the popup
    const { historyData } = await browser.storage.local.get("historyData");
    const updatedHistoryData = historyData || [];
    updatedHistoryData.push({ url: normalizedUrl, title, category });
    await browser.storage.local.set({ historyData: updatedHistoryData });

    console.log(`✅ History saved: ${title} -> ${category}`);
  } catch (err) {
    console.error("❌ Error saving history in background in-memory DB:", err);
  }

  // 3) **MOST IMPORTANT**: Append to CSV so we don't overwrite old data.
  try {
    const domain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
    await updateStoredCSV(domain, title, category);
  } catch (e) {
    console.warn("❗ Could not parse domain for CSV update. Using URL directly.");
    await updateStoredCSV(normalizedUrl, title, category);
  }
}

/* --------------------------------------------------
   8) ATTACH EVENT LISTENERS
----------------------------------------------------*/
function attachEventListeners() {
  browser.history.onVisited.addListener(({ url, title }) => {
    console.log("📌 onVisited Triggered:", url);
    if (title) queueClassification(url, title);
  });

  browser.webNavigation.onCompleted.addListener(async ({ url, tabId }) => {
    console.log("📌 onCompleted Triggered:", url);
    try {
      const tab = await browser.tabs.get(tabId);
      if (tab?.title) queueClassification(url, tab.title);
    } catch (err) {
      console.error("❌ Failed to get tab details:", err);
    }
  });
}

/* --------------------------------------------------
   9) INIT BACKGROUND
----------------------------------------------------*/
(async () => {
  console.log("🚀 Initializing Background Script...");

  dbInMemoryReady = (async () => {
    await loadDatabase();
    console.log("✅ Background script's in-memory DB fully ready!");
  })();

  // Load the AI model in parallel
  loadModel().catch(console.error);

  // NEW: Load any persisted finalBatches from browser.storage.local
  const stored = await browser.storage.local.get("finalBatches");
  if (stored.finalBatches) {
    finalBatches = stored.finalBatches;
    console.log("✅ Loaded finalBatches from storage:", finalBatches);
  }

  // Attach event listeners for visited sites
  attachEventListeners();

  // Wait for in-memory DB to be ready
  await dbInMemoryReady;
  console.log("✅ Background script fully ready!");
})();

/* --------------------------------------------------
   10) CSV UTILS: UPDATE & GET
----------------------------------------------------*/
export async function updateCSVStorage() {
  console.log("📁 Generating CSV...");
  try {
    const csvData = await getStoredCSV();
    if (csvData) {
      console.log("✅ Storing updated CSV in browser.storage.local:", csvData);
      await browser.storage.local.set({ histofyUserCSV: csvData });
    } else {
      console.warn("⚠️ No CSV data found to store.");
    }
  } catch (err) {
    console.error("❌ Error generating CSV:", err);
  }
}

/* --------------------------------------------------
   11) USER LABELS / MESSAGES
----------------------------------------------------*/
browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === "setUserLabel") {
    const { domain, category } = msg;
    console.log(`👤 User-labeled domain=${domain} => ${category}`);

    (async () => {
      try {
        // Wait for SQLite
        await sqliteReady;
        await setUserLabel(domain, category);

        // 🔴 DELETE OLD CACHED CLASSIFICATIONS FROM INDEXEDDB
        await removeAllStaleForDomain(domain);

        // 🔄 Re-generate CSV so it reflects the new label
        await updateCSVStorage();

        // 🔄 Refresh UI
        await browser.storage.local.set({ historyLoading: true });
        setTimeout(() => browser.storage.local.set({ historyLoading: false }), 500);

        console.log("✅ User label updated successfully.");
      } catch (error) {
        console.error("❌ Error setting user label:", error);
      }
    })();
  }

  else if (msg.action === "getCSV") {
    console.log("📁 Fetching stored CSV...");
    (async () => {
      try {
        const csvData = await getStoredCSV();
        console.log("✅ CSV Data Retrieved:", csvData);
        sendResponse({ csvData });
      } catch (err) {
        console.error("❌ Error retrieving CSV:", err);
        sendResponse({ csvData: null });
      }
    })();
    return true; // Keep the message channel open for async
  }

  else if (msg.action === "runBatchClassification") {
    console.log("🚀 Starting Batch Classification...");
    import("./batchClassification.js")
      .then(module => {
        module.batchClassifySites();
      })
      .catch(err => console.error("❌ Error loading batchClassification.js:", err));
  }
});

/* --------------------------------------------------
   12) BATCH LOCK STORAGE
   (Functions to update finalBatches in storage)
----------------------------------------------------*/
// NEW: Called from batchClassification to persist finalBatches
export async function storeFinalBatchClassifications(batchData) {
  // Load current finalBatches from memory & local storage
  const stored = await browser.storage.local.get("finalBatches");
  let currentBatches = stored.finalBatches || finalBatches;

  // Merge new batch data
  Object.keys(batchData).forEach(domain => {
    currentBatches[domain] = batchData[domain];
    console.log(`✅ Final Batch Stored: ${domain} -> ${batchData[domain]}`);
  });

  // Update global reference
  finalBatches = currentBatches;

  // Persist in local storage
  await browser.storage.local.set({ finalBatches: currentBatches });
  console.log("✅ Final batch classifications persisted to storage.");
}

/* --------------------------------------------------
   13) MANUAL CONSOLE UPDATES (Optional)
----------------------------------------------------*/
/**
 * For easy debugging in console:
 * updateCategory("nytimes.com", "Technology & Development");
 */
window.updateCategory = async function (domain, newCategory) {
  console.log(`📝 Manually updating category for ${domain} -> ${newCategory}`);

  // Wait for the DB
  await sqliteReady;

  // 1) Manually set user label
  await setUserLabel(domain, newCategory);

  // 2) Remove stale classification from IndexedDB
  await removeAllStaleForDomain(domain);

  // 3) Re-generate CSV with updated label
  await updateCSVStorage();

  // 4) Refresh UI in popup if open
  await browser.storage.local.set({ historyLoading: true });
  setTimeout(() => browser.storage.local.set({ historyLoading: false }), 500);

  console.log(`✅ Manually updated ${domain} => ${newCategory}`);
};

/**
 * Export classifyWithCache & classifyWithAI
 * so they're available to other modules.
 */
export { classifyWithAI };

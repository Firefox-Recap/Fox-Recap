/**
 * @file background.js
 * @description Core background script for the Histofy browser extension.
 * It tracks browser history, classifies visited pages (rule-based & AI-based),
 * caches results in IndexedDB, manages user-labeled categories in SQLite,
 * supports batch classification, CSV generation, and event-driven updates.
 */

import initSqlJs from "sql.js";
import { CATEGORY_OPTIONS } from "../../models/transformers.js";
import { loadModel, classifyPage, getEmbedding,loadEmbeddingModel } from "../../models/transformers.js";
import { DOMAIN_LOCKS } from "../storage/domainLocks.js";
import { backfillEmbeddingsIfMissing } from "../storage/backfillEmbeddings.js";
import { getTopVisitedDomains } from './analytics.js';
import { shouldBlockDomain } from "../storage/privacyGuard.js";
import { trackVisitDuration } from "../storage/indexedDB.js";
import { initDB } from "../storage/indexedDB.js";





import {
  cacheClassification,
  getCachedClassification,
  cacheEmbedding,
  getMatchingEmbedding,
  removeAllStaleForDomain,
  updateStoredCSV,
  getStoredCSV,
  loadEmbeddingRecoveryIfMissing,
} from "../storage/indexedDB.js"; // 👈 ADDED import here

import {
  getUserLabel,
  setUserLabel,
  dbReady as sqliteReady,
} from "../storage/sqlite.js";

/** 
 * ✅ Import from StorageManager so we can load finalBatches, bootstrap, and fetch them on demand.
 */
import {
  loadFinalBatches,
  bootstrapFinalBatchesFromLocks,
  getAllFinalBatches,
} from "../storage/StorageManager.js";

let db = null; // local in-memory DB
let dbInMemoryReady = null;

let activeTabInfo = {
  tabId: null,
  domain: null,
  startTime: null,
};


const recentUrls = new Set();
const DUPLICATE_TIMEOUT_MS = 5000;
const classificationQueue = [];
let batchTimer = null;



/* --------------------------------------------------
   1) RULE-BASED CLASSIFICATION
----------------------------------------------------*/
function ruleBasedCategory(domain) {
  if (!domain) return null;
  const lowerDomain = domain.trim().toLowerCase();

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
    ],
  };

  // Check for keywords
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => lowerDomain.includes(keyword))) {
      return category;
    }
  }

  // Regex-based fallback checks for all categories
  if (/(\.gov|senate|congress|whitehouse|parliament|europa|un|uscis|census)/.test(lowerDomain)) return "Government & Politics";
  if (/(\.edu|university|college|academy|school|learning|training|course|study)/.test(lowerDomain)) return "Education & Learning";
  if (/(\.bank|financial|creditunion|investment|mortgage|loan|fund|capital|finance|wealth|money|crypto|blockchain)/.test(lowerDomain)) return "Finance & Banking";
  if (/(\.realestate|property|homes|apartments|rent|housing|realtor|zillow|redfin|trulia)/.test(lowerDomain)) return "Real Estate & Housing";
  if (/(\.health|clinic|medical|hospital|wellness|fitness|pharmacy|drugstore|therapy|doctor|care|med)/.test(lowerDomain)) return "Health & Wellness";
  if (/(\.shop|store|ecommerce|shopping|retail|marketplace|cart|deals|sale|buy|sell)/.test(lowerDomain)) return "Shopping & E-Commerce";
  if (/(\.tech|technology|dev|developer|coding|programming|software|hardware|it|computing|ai|ml|data|cloud)/.test(lowerDomain)) return "Technology & Development";
  if (/(\.news|media|press|journal|report|article|headline|breaking|update|blog|magazine)/.test(lowerDomain)) return "News & Media";
  if (/(\.social|network|community|forum|chat|messaging|connect|friends|group|profile|feed)/.test(lowerDomain)) return "Social Media & Networking";
  if (/(\.entertainment|stream|video|music|movie|tv|show|podcast|audiobook|playlist|watch|listen)/.test(lowerDomain)) return "Entertainment & Streaming";
  if (/(\.sports|fitness|exercise|workout|athletics|team|league|game|match|score|run|goal|play)/.test(lowerDomain)) return "Sports & Fitness";
  if (/(\.business|productivity|work|task|project|management|crm|erp|collaboration|enterprise|office|tools)/.test(lowerDomain)) return "Business & Productivity";
  if (/(\.travel|tourism|vacation|trip|flight|hotel|booking|airline|cruise|destination|explore|adventure)/.test(lowerDomain)) return "Travel & Tourism";
  if (/(\.ads|advertising|tracker|analytics|marketing|campaign|pixel|tag|banner|promotion|conversion)/.test(lowerDomain)) return "Ads & Trackers";
  if (/(\.car|auto|vehicle|motor|drive|ride|transport|garage|repair|dealer|rental|truck|bike)/.test(lowerDomain)) return "Automotive";
  if (/(\.game|gaming|play|console|esports|arcade|rpg|fps|mmo|strategy|puzzle|adventure|simulation)/.test(lowerDomain)) return "Gaming";
  if (/(\.science|research|study|experiment|lab|biology|physics|chemistry|space|nasa|arxiv|journal)/.test(lowerDomain)) return "Science & Research";

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

function getDomainFromURL(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
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
function getRootDomain(domain) {
  return domain.split(".").slice(-2).join(".");
}

function getDomainLock(domain, rootDomain) {
  return DOMAIN_LOCKS[domain] || DOMAIN_LOCKS[rootDomain];
}

export async function classifyWithCache(url, title) {
  let domain = "";
  try {
    const parsedUrl = new URL(url);
    domain = parsedUrl.hostname.replace(/^www\./, "");
  } catch {
    console.warn(`❗ Could not parse domain. Skipping entry. URL: ${url}`);
    return "Other";
  }

  // Skip non-standard URLs (e.g., about:blank, chrome://, service worker URLs)
  if (!domain || domain === "about:blank" || domain.startsWith("chrome://") || domain.includes("service_worker")) {
    console.warn(`❗ Skipping entry with non-standard or empty domain. URL: ${url}`);
    return "Other";
  }

  await sqliteReady; // Ensure SQLite is ready
  const rootDomain = getRootDomain(domain);

  // 1) PRIORITY CHECK: DOMAIN LOCKS
  const domainLockCategory = getDomainLock(domain, rootDomain);
  if (domainLockCategory) {
    console.log(`🛑 Domain Lock Applied: ${domain} → ${domainLockCategory}`);
    await cacheClassification(title, domainLockCategory);
    return domainLockCategory;
  }

  // Inherit classification from root domain if no specific lock exists
  if (domain !== rootDomain && DOMAIN_LOCKS[rootDomain]) {
    console.log(`🔄 Inheriting classification from root domain: ${rootDomain}`);
    await cacheClassification(title, DOMAIN_LOCKS[rootDomain]);
    return DOMAIN_LOCKS[rootDomain];
  }

  // 2) CHECK FINAL BATCH CLASSIFICATIONS (via StorageManager)
  const allFinalBatches = await getAllFinalBatches();
  if (allFinalBatches[rootDomain]) {
    console.log(`🛑 Batch Lock Applied: ${rootDomain} → ${allFinalBatches[rootDomain]}`);
    await cacheClassification(title, allFinalBatches[rootDomain]);
    return allFinalBatches[rootDomain];
  }

  // 3) CHECK USER-LABELED CATEGORIES (SQLite)
  const userCategory = getUserLabel(rootDomain);
  if (userCategory && userCategory !== "Unknown") {
    console.log(`👤 Using stored user-labeled category for ${rootDomain}: ${userCategory}`);
    await cacheClassification(title, userCategory);
    return userCategory;
  }

  // 4) RULE-BASED CLASSIFICATION
  const ruleCategory = ruleBasedCategory(domain);
  if (ruleCategory && ruleCategory !== "Other") {
    console.log(`⚡ Rule-based classification: ${domain} -> ${ruleCategory}`);
    await cacheClassification(title, ruleCategory);
    return ruleCategory;
  }

  // 5) RETRIEVE CACHED CLASSIFICATIONS (IndexedDB)
  const textForClassification = `${title} (Domain: ${domain})`;
  const cachedCategory = await getCachedClassification(rootDomain, title);
  if (cachedCategory) {
    console.log(`🔄 Using Cached Classification: ${domain}, ${title} → ${cachedCategory}`);
    return cachedCategory;
  }

  // 6) CHECK CACHED EMBEDDINGS
  let embedding;
  try {
    embedding = await getEmbedding(textForClassification);
    const matchedEmbeddingCategory = await getMatchingEmbedding(embedding);
    if (matchedEmbeddingCategory) {
      console.log(`🔄 Using Cached Embedding Classification for "${title}": ${matchedEmbeddingCategory}`);
      return matchedEmbeddingCategory;
    }
  } catch (error) {
    console.error("❌ Error during embedding generation or matching:", error);
  }

  // 7) AI FALLBACK (Only if no other classification exists)
  console.log(`🤖 AI Fallback Triggered for: ${title}`);
  const zeroShotCategory = await classifyWithAI(domain, title);
  console.log(`🤖 AI Classified: "${title}" -> ${zeroShotCategory}`);

  // 8) FINAL CATEGORY + Cache
  const finalCategory = zeroShotCategory && CATEGORY_OPTIONS.includes(zeroShotCategory)
    ? zeroShotCategory
    : "Other";

  if (embedding) {
    await cacheEmbedding(textForClassification, embedding, finalCategory);
  }
  await cacheClassification(title, finalCategory);
  return finalCategory;
}

/* --------------------------------------------------
   5) BATCH CLASSIFICATION
----------------------------------------------------*/
function queueClassification(url, title) {
  if (shouldBlockDomain(url, title)) {
    console.log("⛔ Blocked by privacyGuard (queue):", url);
    return;
  }

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
  await dbInMemoryReady;
  if (!db) {
    console.error("❌ In-memory DB not initialized. Cannot save history.");
    return;
  }

  if (shouldBlockDomain(url, title)) {
    console.log("⛔ Skipping blocked/suspicious domain:", url);
    return;
  }

  const normalizedUrl = normalizeUrl(url);
  const normalizedDomain = normalizeDomain(new URL(normalizedUrl).hostname);

  if (!normalizedDomain) {
    console.warn("❗ Skipping entry with empty domain.");
    return;
  }

  if (recentUrls.has(normalizedDomain)) {
    console.log(`🔄 Skipping duplicate: ${normalizedDomain}`);
    return;
  }

  recentUrls.add(normalizedDomain);
  setTimeout(() => recentUrls.delete(normalizedDomain), DUPLICATE_TIMEOUT_MS);

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

    const { historyData } = await browser.storage.local.get("historyData");
    const updatedHistoryData = historyData || [];
    updatedHistoryData.push({ url: normalizedUrl, title, category });
    await browser.storage.local.set({ historyData: updatedHistoryData });

    console.log(`✅ History saved: ${title} -> ${category}`);
  } catch (err) {
    console.error("❌ Error saving history:", err);
  }

  try {
    const visitDB = await initDB();
    const tx = visitDB.transaction("visits", "readwrite");
    await tx.store.add({
      domain: normalizedDomain,
      timestamp: Date.now(),
      url: normalizedUrl,
      title,
      category,
    });
    await tx.done;
    console.log(`📊 Visit stored in IndexedDB for domain: ${normalizedDomain}`);
  } catch (e) {
    console.error("❌ Error writing to visits store:", e);
  }

  try {
    if (normalizedDomain && category) {
      await updateStoredCSV(normalizedDomain, title, category);
    } else {
      console.warn("❗ Skipping CSV update due to missing domain or category.");
    }
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

  // ✅ Preload both AI models
  console.time("🧠 Model Load Time");
  await loadModel();
  console.timeEnd("🧠 Model Load Time");

  console.time("🧠 Embedding Model Load Time");
  await loadEmbeddingModel();
  console.timeEnd("🧠 Embedding Model Load Time");

  // ✅ Restore missing embeddings
  await loadEmbeddingRecoveryIfMissing();

  // ✅ Load final batches
  await loadFinalBatches();

  // ✅ Apply domain locks
  console.log("🔄 Initializing extension...");
  await bootstrapFinalBatchesFromLocks();
  console.log("✅ Extension initialized.");

  // ✅ Backfill if needed
  try {
    console.log("🔥 Attempting to call backfillEmbeddingsIfMissing()...");
    backfillEmbeddingsIfMissing();
  } catch (err) {
    console.error("❌ backfillEmbeddingsIfMissing() threw an error:", err);
  }

  // ✅ Events
  attachEventListeners();
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
browser.runtime.onMessage.addListener(async(msg, sender, sendResponse) => {
  console.log("📩 [Background] Message received:", msg); // 🔥 Top-level debug log

  // --- User Label Set ---
  if (msg.action === "setUserLabel") {
    const { domain, category } = msg;
    console.log(`👤 [Background] User-labeled domain=${domain} => ${category}`);

    (async () => {
      try {
        await sqliteReady;
        await setUserLabel(domain, category);
        await removeAllStaleForDomain(domain);
        await updateCSVStorage();

        await browser.storage.local.set({ historyLoading: true });
        setTimeout(() => browser.storage.local.set({ historyLoading: false }), 500);

        console.log("✅ [Background] User label updated successfully.");
        sendResponse({ success: true });
      } catch (error) {
        console.error("❌ [Background] Error setting user label:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep channel open
  }

  // --- CSV Request ---
  else if (msg.action === "getCSV") {
    console.log("📁 [Background] Fetching stored CSV...");

    (async () => {
      try {
        const csvData = await getStoredCSV();
        console.log("✅ [Background] CSV Data Retrieved:", csvData);
        sendResponse({ csvData });
      } catch (err) {
        console.error("❌ [Background] Error retrieving CSV:", err);
        sendResponse({ csvData: null });
      }
    })();

    return true; // Keep channel open
  }

  // --- Run Batch Classification ---
  else if (msg.action === "runBatchClassification") {
    console.log("🚀 [Background] Starting Batch Classification...");

    (async () => {
      try {
        const module = await import("./batchClassification.js");
        await module.batchClassifySites();
        console.log("✅ [Background] Batch classification completed.");
        sendResponse({ success: true });
      } catch (err) {
        console.error("❌ [Background] Error loading batchClassification.js:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();

    return true;
  }

  // --- Get Top Visited Domains ---
  else if (msg.action === "GET_TOP_VISITED_DOMAINS") {
    console.log("📊 [Background] Received GET_TOP_VISITED_DOMAINS request");

    getTopVisitedDomains(msg.limit || 10)
      .then((data) => {
        console.log("📊 [Background] Top domains:", data);
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error("❌ [Background] Error in getTopVisitedDomains:", err);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }

  else if (msg.action === "GET_ALL_VISITS") {
    try {
      const db = await initDB();
      const visits = await db.getAll("visits");
  
      sendResponse({ success: true, data: visits });
    } catch (err) {
      console.error("❌ Error retrieving visits from IndexedDB:", err);
      sendResponse({ success: false, error: err.message });
    }
    return true; // Keep message channel open
  }

  else if (msg.action === "GET_PEAK_HOURS") {
    console.log("📊 [Background] Calculating peak browsing hours...");
  
    try {
      const db = await initDB();
      const visits = await db.getAll("visitDurations");
  
      const hourTotals = Array(24).fill(0); // index = hour (0-23)
  
      for (const { timestamp, duration } of visits) {
        const date = new Date(timestamp);
        const hour = date.getHours();
        hourTotals[hour] += duration;
      }
  
      const formatted = hourTotals.map((ms, hour) => ({
        hour,
        duration: ms,
        label: `${hour}:00`,
      }));
  
      console.log("✅ Peak Hours Data:", formatted);
      sendResponse({ success: true, data: formatted });
    } catch (err) {
      console.error("❌ Error calculating peak hours:", err);
      sendResponse({ success: false, error: err.message });
    }
  
    return true;
  }
  
  

  else if (msg.action === "GET_CATEGORY_DURATIONS") {
    console.log("📊 [Background] Fetching category durations...");
  
    try {
      const db = await initDB();
      const visits = await db.getAll("visitDurations");
  
      // Fetch classification cache so we can map domain → category
      const classified = await db.getAll("classifications"); // assuming cacheClassification writes here
      const domainToCategory = {};
      for (const entry of classified) {
        const parsedDomain = getDomainFromURL(entry.title);
        if (parsedDomain && entry.category) {
          domainToCategory[parsedDomain] = entry.category;
        }
      }
  
      // Aggregate total time by category
      const timeByCategory = {};
      for (const { domain, duration } of visits) {
        const category = domainToCategory[domain] || "Uncategorized";
        timeByCategory[category] = (timeByCategory[category] || 0) + duration;
      }
  
      // Turn into percentage breakdown
      const totalDuration = Object.values(timeByCategory).reduce((a, b) => a + b, 0);
      const results = Object.entries(timeByCategory).map(([category, duration]) => ({
        category,
        duration,
        percent: totalDuration ? ((duration / totalDuration) * 100).toFixed(2) : "0.00",
      }));
  
      console.log("✅ Category Durations:", results);
      sendResponse({ success: true, data: results });
    } catch (err) {
      console.error("❌ Error fetching category durations:", err);
      sendResponse({ success: false, error: err.message });
    }
  
    return true;
  }
  

  // --- Unknown Message ---
  else {
    console.warn("⚠️ [Background] Unrecognized message:", msg);
  }
});

/* --------------------------------------------------
   12) VISIT DURATION TRACKING
----------------------------------------------------*/
browser.tabs.onActivated.addListener(async (activeInfo) => {
  const { tabId } = activeInfo;
  const tab = await browser.tabs.get(tabId);
  const newDomain = getDomainFromURL(tab.url);

  const now = Date.now();

  if (activeTabInfo.domain && activeTabInfo.domain !== newDomain && activeTabInfo.startTime) {
    const duration = now - activeTabInfo.startTime;
    console.log(`🟡 Tab switch: ${activeTabInfo.domain} → ${newDomain} after ${duration} ms`);
    await trackVisitDuration(activeTabInfo.domain, duration);
  }

  activeTabInfo = {
    tabId,
    domain: newDomain,
    startTime: now,
  };
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  if (activeTabInfo.tabId === tabId && activeTabInfo.domain && activeTabInfo.startTime) {
    const duration = Date.now() - activeTabInfo.startTime;
    console.log(`🟡 Tab closed: ${activeTabInfo.domain} after ${duration} ms`);
    await trackVisitDuration(activeTabInfo.domain, duration);
    activeTabInfo = { tabId: null, domain: null, startTime: null };
  }
});

browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) return;

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    const domain = getDomainFromURL(activeTab.url);
    const now = Date.now();

    if (activeTabInfo.domain && activeTabInfo.domain !== domain && activeTabInfo.startTime) {
      const duration = now - activeTabInfo.startTime;
      console.log(`🟡 Window focus change: ${activeTabInfo.domain} → ${domain} after ${duration} ms`);
      await trackVisitDuration(activeTabInfo.domain, duration);
    }

    activeTabInfo = {
      tabId: activeTab.id,
      domain,
      startTime: now,
    };
  } catch (err) {
    console.warn("❌ Could not handle window focus change:", err);
  }
});

// ✅ Optional safety: Flush visit duration on suspend/shutdown
browser.runtime.onSuspend?.addListener(async () => {
  const now = Date.now();
  if (activeTabInfo.domain && activeTabInfo.startTime) {
    const duration = now - activeTabInfo.startTime;
    console.log(`💾 Runtime suspend: Flushing ${activeTabInfo.domain} after ${duration} ms`);
    await trackVisitDuration(activeTabInfo.domain, duration);
  }
});







/* --------------------------------------------------
   13) MANUAL CONSOLE UPDATES (Optional)
----------------------------------------------------*/
/**
 * For easy debugging in console:
 * updateCategory("nytimes.com", "Technology & Development");
 */
window.updateCategory = async function (domain, newCategory) {
  console.log(`📝 Manually updating category for ${domain} -> ${newCategory}`);
  await sqliteReady;
  await setUserLabel(domain, newCategory);
  await removeAllStaleForDomain(domain);
  await updateCSVStorage();
  await browser.storage.local.set({ historyLoading: true });
  setTimeout(() => browser.storage.local.set({ historyLoading: false }), 500);
  console.log(`✅ Manually updated ${domain} => ${newCategory}`);
};

/**
 * Export classifyWithCache & classifyWithAI
 * so they're available to other modules.
 */
export { classifyWithAI };

/**
 * 🧪 Manual Console Debug Commands (For Developer Use)
 * These give live visibility into IndexedDB, durations, and history tracking.
 *
 * - window.logVisitDurations() → shows domain-level time spent
 * - window.logCategoryDurations() → shows time per category (% breakdown)
 * - window.logTopDomains(sortBy?) → shows top domains (by visits or duration)
 * - window.logAllVisits() → shows all raw visits with timestamp + titles
 *
 * Example:
 *   window.logTopDomains("visits");
 *   window.logTopDomains("duration");
 */


/**
 * ⏱️ Manually log visit durations in readable format
 * Usage: window.logVisitDurations()
 */
window.logVisitDurations = async () => {
  const { getVisitDurations } = await import("../storage/indexedDB.js");
  const durations = await getVisitDurations();

  const domainTotals = {};

  for (const { domain, duration } of durations) {
    domainTotals[domain] = (domainTotals[domain] || 0) + duration;
  }

  const formatDuration = (ms) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)} sec`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
    return `${(seconds / 3600).toFixed(2)} hr`;
  };

  console.log("⏱️ Visit Durations:");
  for (const [domain, totalMs] of Object.entries(domainTotals)) {
    console.log(`  • ${domain}: ${formatDuration(totalMs)} (${totalMs} ms)`);
  }
};

window.logCategoryDurations = async () => {
  const db = await initDB();
  const visits = await db.getAll("visitDurations");
  const classifications = await db.getAll("classifications");

  const domainToCategory = {};
  for (const entry of classifications) {
    try {
      const parsed = new URL("https://" + entry.title); // fallback-safe
      const domain = parsed.hostname.replace(/^www\./, "");
      if (domain && entry.category) {
        domainToCategory[domain] = entry.category;
      }
    } catch {
      // skip invalid
    }
  }

  const categoryDurations = {};
  for (const { domain, duration } of visits) {
    if (!domain || typeof duration !== "number") continue;
    const category = domainToCategory[domain] || "Uncategorized";
    categoryDurations[category] = (categoryDurations[category] || 0) + duration;
  }

  const total = Object.values(categoryDurations).reduce((a, b) => a + b, 0);
  console.log("📊 Time by Category:");
  for (const [cat, dur] of Object.entries(categoryDurations)) {
    const minutes = dur / 60000;
    const percent = ((dur / total) * 100).toFixed(1);
    const formatted =
      minutes >= 60
        ? `${(minutes / 60).toFixed(1)} hr`
        : minutes >= 1
        ? `${minutes.toFixed(1)} min`
        : `${(dur / 1000).toFixed(1)} sec`;
    console.log(`  ${cat}: ${formatted} (${percent}%)`);
  }
};

window.logTopDomains = async (sortBy = "duration") => {
  const { getAllVisits, getVisitDurations } = await import("../storage/indexedDB.js");
  const { parse } = await import("tldts");

  const visits = await getAllVisits();
  const durations = await getVisitDurations();

  const stats = {};

  for (const v of visits) {
    const domain = parse(v.url)?.domain;
    if (!domain) continue;
    stats[domain] = stats[domain] || { visits: 0, duration: 0 };
    stats[domain].visits += 1;
  }

  for (const d of durations) {
    if (stats[d.domain]) stats[d.domain].duration += d.duration;
  }

  const sorted = Object.entries(stats)
    .sort((a, b) =>
      sortBy === "visits"
        ? b[1].visits - a[1].visits
        : b[1].duration - a[1].duration
    )
    .slice(0, 10);

  console.log(`📊 Top Domains by ${sortBy}:`);
  for (const [domain, { visits, duration }] of sorted) {
    const label =
      duration >= 3600000
        ? `${(duration / 3600000).toFixed(1)} hr`
        : duration >= 60000
        ? `${(duration / 60000).toFixed(1)} min`
        : `${(duration / 1000).toFixed(1)} sec`;
    console.log(`  ${domain}: ${visits} visits, ${label}`);
  }
};

/**
 * 📄 Manually log all visit entries (raw data from IndexedDB)
 * Usage: window.logAllVisits()
 */
window.logAllVisits = async () => {
  const db = await initDB();
  const visits = await db.getAll("visits");

  if (!visits.length) {
    console.log("📄 No visit records found.");
    return;
  }

  console.log("📄 All Visit Entries:");
  for (const { domain, timestamp, url, title, category } of visits) {
    const date = new Date(timestamp).toLocaleString();
    console.log(`• [${date}] ${domain} → ${title} (${category})`);
    console.log(`   ↳ ${url}`);
  }
};

/**
 * 📈 Log peak hour activity in the console (direct DB query version)
 * Usage: window.logPeakHours()
 */
window.logPeakHours = async () => {
  const db = await initDB();
  const visits = await db.getAll("visitDurations");

  const hourTotals = Array(24).fill(0); // index = hour (0-23)

  for (const { timestamp, duration } of visits) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    hourTotals[hour] += duration;
  }

  console.log("📈 Peak Browsing Hours:");
  for (let hour = 0; hour < 24; hour++) {
    const ms = hourTotals[hour];
    const label = ms >= 3600000
      ? `${(ms / 3600000).toFixed(1)} hr`
      : ms >= 60000
      ? `${(ms / 60000).toFixed(1)} min`
      : `${(ms / 1000).toFixed(1)} sec`;
    console.log(`  ${hour}:00 — ${label}`);
  }
};

/**
 * 📆 Log time spent browsing by day of the week
 * Usage: window.logPeakDays()
 */
window.logPeakDays = async () => {
  const db = await initDB();
  const visits = await db.getAll("visitDurations");

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const totalsByDay = Array(7).fill(0); // 0 = Sunday, 6 = Saturday

  for (const { timestamp, duration } of visits) {
    const date = new Date(timestamp);
    const dayIndex = date.getDay();
    totalsByDay[dayIndex] += duration;
  }

  const formatDuration = (ms) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)} sec`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
    return `${(seconds / 3600).toFixed(2)} hr`;
  };

  console.log("📆 Peak Browsing Days:");
  for (let i = 0; i < 7; i++) {
    console.log(`  ${daysOfWeek[i]} — ${formatDuration(totalsByDay[i])}`);
  }
};

/**
 * 📊 Log peak browsing days with category breakdowns
 * Usage: window.logPeakDaysByCategory()
 */
window.logPeakDaysByCategory = async () => {
  const db = await initDB();
  const visits = await db.getAll("visitDurations");
  const classifications = await db.getAll("classifications");

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const totals = Array(7).fill(null).map(() => ({ total: 0, categories: {}, domainsByCategory: {} }));

  const domainToCategory = {};

  for (const entry of classifications) {
    try {
      let domain;
      if (entry.domain) {
        domain = entry.domain.replace(/^www\./, "");
      } else if (entry.url) {
        domain = new URL(entry.url).hostname.replace(/^www\./, "");
      } else if (entry.title && entry.title.includes(".")) {
        // fallback: treat title as domain if no domain/url fields exist
        domain = entry.title.toLowerCase().replace(/^www\./, "").split(" ")[0];
      }

      if (domain && entry.category) {
        domainToCategory[domain] = entry.category;
      }
    } catch (e) {
      console.warn("⚠️ Failed to extract domain from classification entry:", e);
    }
  }

  for (const { timestamp, domain, duration } of visits) {
    if (!domain || typeof duration !== "number") continue;

    const dayIndex = new Date(timestamp).getDay();
    const category = domainToCategory[domain] || "Uncategorized";

    totals[dayIndex].total += duration;
    totals[dayIndex].categories[category] = (totals[dayIndex].categories[category] || 0) + duration;

    if (!totals[dayIndex].domainsByCategory[category]) {
      totals[dayIndex].domainsByCategory[category] = new Set();
    }
    totals[dayIndex].domainsByCategory[category].add(domain);
  }

  const formatMs = (ms) => {
    const min = ms / 60000;
    return min >= 1 ? `${min.toFixed(1)} min` : `${(ms / 1000).toFixed(1)} sec`;
  };

  console.log("📊 Peak Day + Category Breakdown:");
  for (let i = 0; i < 7; i++) {
    const { total, categories, domainsByCategory } = totals[i];
    if (total === 0) continue;

    console.log(`\n📅 ${daysOfWeek[i]} — ${formatMs(total)}`);

    const sorted = Object.entries(categories).sort(([, a], [, b]) => b - a);

    for (const [cat, dur] of sorted) {
      const domainList = Array.from(domainsByCategory[cat]).join(", ");
      console.log(`  • ${cat}: ${formatMs(dur)} (Domains: ${domainList})`);
    }
  }
};




  
  

/**
 * @file StorageManager.js
 * @description Centralized module to handle persistent classification storage for locked domains.
 * Ensures updates are atomic across IndexedDB, SQLite, finalBatches, and CSV.
 */

import { setUserLabel } from "../storage/sqlite.js";
import {
  cacheClassification,
  cacheEmbedding,
  updateStoredCSV,
  removeAllStaleForDomain,
} from "../storage/indexedDB.js";
import {
  getEmbedding,
  loadEmbeddingModel,
} from "../../models/transformers.js";
import { DOMAIN_LOCKS, loadDomainLocks } from './domainLocks.js';

let finalBatches = {}; // Runtime memory

/**
 * Normalize domain (remove www. and get root domain)
 */
function normalizeDomain(domain) {
  return domain.replace(/^www\./, "").split(".").slice(-2).join(".");
}

/**
 * Save a locked classification across all layers
 */
export async function saveFinalBatch(domain, category, options = {}) {
  const { skipEmbedding = false, useFakeEmbedding = false } = options;

  try {
    const rootDomain = normalizeDomain(domain);
    const title = `Locked Category: ${domain} → ${category}`;

    console.time(`📝 Saving: ${domain}`);

    // 1. SQLite
    await setUserLabel(rootDomain, category);

    // 2. IndexedDB
    await cacheClassification(domain, category);

    // 3. Embedding (optional)
    if (!skipEmbedding) {
      console.time(`🔢 Embedding: ${domain}`);
      const embedding = await getEmbedding(title, useFakeEmbedding);
      console.timeEnd(`🔢 Embedding: ${domain}`);
      if (embedding) {
        await cacheEmbedding(title, embedding, category);
      }
    }

    // 4. CSV
    await updateStoredCSV(domain, title, category);

    // 5. Update memory + browser storage
    const stored = await browser.storage.local.get("finalBatches");
    finalBatches = stored.finalBatches || {};
    finalBatches[rootDomain] = category;
    await browser.storage.local.set({ finalBatches });

    console.timeEnd(`📝 Saving: ${domain}`);
    console.log(`✅ Final batch saved: ${domain} → ${category}${skipEmbedding ? " (embedding skipped)" : ""}`);
  } catch (err) {
    console.error(`❌ Error saving final batch for ${domain}:`, err);
  }
}

/**
 * ⚡ Batch save domain locks with concurrency control
 * @param {Object} domainMap - DOMAIN_LOCKS object
 * @param {number} concurrency - Number of parallel saves
 * @param {Object} options - Options to pass into saveFinalBatch (e.g., { skipEmbedding: true })
 */
export async function throttleBatch(domainMap, concurrency = 4, options = {}) {
  const domains = Object.keys(domainMap);
  let index = 0;

  async function worker() {
    while (index < domains.length) {
      const domain = domains[index++];
      const category = domainMap[domain];
      try {
        await saveFinalBatch(domain, category, options);
      } catch (e) {
        console.error("❌ Failed to batch domain:", domain, e);
      }
    }
  }

  console.time("🚀 Throttle Batch Time");
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  console.timeEnd("🚀 Throttle Batch Time");
}

/**
 * Load finalBatches from browser.storage.local
 */
export async function loadFinalBatches() {
  const stored = await browser.storage.local.get("finalBatches");
  finalBatches = stored.finalBatches || {};
  console.log("✅ Final batches loaded:", finalBatches);
  return finalBatches;
}

/**
 * Rebuild finalBatches from domainLocks.js if none exists
 */
export async function bootstrapFinalBatchesFromLocks() {
  await loadDomainLocks();

  const stored = await browser.storage.local.get("finalBatches");
  if (stored.finalBatches && Object.keys(stored.finalBatches).length > 0) {
    console.log("✅ finalBatches already exists. No bootstrap needed.");
    return;
  }

  // ✅ Preload the embedding model once (only if we're using it)
  const useEmbeddings = false; // set to true if you want real embeddings on bootstrap
  if (useEmbeddings) {
    await loadEmbeddingModel();
  }

  console.log("🛠 Bootstrapping from DOMAIN_LOCKS with batching...");
  await throttleBatch(DOMAIN_LOCKS, 4, {
    skipEmbedding: !useEmbeddings,
    useFakeEmbedding: !useEmbeddings,
  });
  console.log("✅ Bootstrapping complete.");
}

/**
 * Remove a final batch domain across all layers
 */
export async function removeFinalBatch(domain) {
  try {
    const rootDomain = normalizeDomain(domain);

    // 1. Remove from SQLite, IndexedDB, embeddings
    await removeAllStaleForDomain(domain);

    // 2. Remove from finalBatches
    const stored = await browser.storage.local.get("finalBatches");
    finalBatches = stored.finalBatches || {};
    delete finalBatches[rootDomain];
    await browser.storage.local.set({ finalBatches });

    console.log(`🗑 Final batch removed: ${domain}`);
  } catch (err) {
    console.error(`❌ Failed to remove batch for ${domain}`, err);
  }
}

/**
 * Get all currently stored final batch domain → category mappings
 */
export async function getAllFinalBatches() {
  const stored = await browser.storage.local.get("finalBatches");
  return stored.finalBatches || {};
}

/**
 * Sync DOMAIN_LOCKS to browser.storage.local (optional, useful for DevTools)
 */
export async function syncDomainLocksToStorage() {
  try {
    await browser.storage.local.set({ DOMAIN_LOCKS });
    console.log("📦 DOMAIN_LOCKS mirrored to storage.");
  } catch (err) {
    console.error("❌ Failed to sync DOMAIN_LOCKS:", err);
  }
}




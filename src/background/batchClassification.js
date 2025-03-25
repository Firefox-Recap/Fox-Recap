/**
 * @file batchClassification.js
 * @description Automates classification and storage of locked domains using DOMAIN_LOCKS.
 * Ensures each domain is persistently stored across SQLite, IndexedDB, embeddings, and CSV.
 */

import { DOMAIN_LOCKS } from "../storage/domainLocks.js"; // ✅ Static source of truth
import { saveFinalBatch } from "../storage/StorageManager.js";

/**
 * 🚀 Main batch classification function (LOCKED DOMAINS ONLY)
 */
export async function batchClassifySites() {
  console.log(`🚀 Starting batch classification for locked domains...`);

  //await loadModel(); // ✅ Load AI model once

  for (const domain in DOMAIN_LOCKS) {
    const category = DOMAIN_LOCKS[domain];
    console.log(`🔒 Lock: ${domain} → ${category}`);

    await saveFinalBatch(domain, category); // ✅ StorageManager handles everything
  }

  console.log("✅ All locked domains classified and persisted!");
}

// 🚀 Auto-run batch classification when script loads
batchClassifySites();

/**
 * @file batchClassification.js
/**
 * batchClassification.js
 * ------------------------------------------------
 * Purpose:
 * This script automates the batch classification process for domains
 * with strict adherence to pre-defined locks. It ensures that:
 * 1) Locked domains are classified and stored persistently.
 * 2) Results are saved in IndexedDB and SQLite for quick access.
 * 3) AI embeddings are generated for future learning.
 * 4) Domain locks are updated and maintained consistently.
 * ------------------------------------------------
 * Notes:
 * - This script is critical for maintaining the integrity of domain
 *   classifications and ensuring AI models are trained with accurate data.
 * - Manual updates to DOMAIN_LOCKS should be logged and reviewed.
 */

import { storeFinalBatchClassifications } from "./background.js";
import { cacheClassification, cacheEmbedding } from "../storage/indexedDB.js";
import { setUserLabel } from "../storage/sqlite.js";
import { DOMAIN_LOCKS } from "../storage/domainLocks.js";  // ✅ Import centralized domain locks
import { loadModel, getEmbedding } from "../../models/transformers.js";

/**
 * 🚀 Main batch classification function (DOMAIN LOCKS ONLY)
 */
export async function batchClassifySites() {
    console.log(`🚀 Starting batch classification for locked domains...`);

    await loadModel(); // ✅ Load AI Model once

    let finalBatchData = {};  // Stores locked classifications
    let updatedDomainLocks = { ...DOMAIN_LOCKS };  // ✅ Copy existing locks for modification

    // ✅ Load previously stored batch classifications to prevent overwriting
    const stored = await browser.storage.local.get("finalBatches");
    let currentBatches = stored.finalBatches || {};

    // ✅ Iterate ONLY over sites in DOMAIN_LOCKS
    for (const domain in DOMAIN_LOCKS) {
        console.log(`🔎 Verifying Lock: ${domain}`);

        let category = DOMAIN_LOCKS[domain];

        // ✅ Step 1: Store the classification in IndexedDB & SQLite
        await cacheClassification(domain, category);
        await setUserLabel(domain, category); // Save user label in SQLite

        // ✅ Step 2: Generate embeddings for AI learning
        const textForEmbedding = `Locked Category: ${domain} → ${category}`;
        const embedding = await getEmbedding(textForEmbedding);
        if (embedding) {
            await cacheEmbedding(textForEmbedding, embedding, category);
            console.log(`✅ Embedding stored for "${domain}" → ${category}`);
        }

        // ✅ Step 3: Lock classification permanently
        finalBatchData[domain] = category;
        updatedDomainLocks[domain] = category;  // ✅ Keep DOMAIN_LOCKS updated
        currentBatches[domain] = category; // ✅ Ensure stored batches are merged

        console.log(`✅ Lock Verified: ${domain} → ${category}`);
    }

    console.log("🏁 Batch classification complete!");
    console.table(updatedDomainLocks);

    // ✅ Persist final batch classification to IndexedDB
    await storeFinalBatchClassifications(currentBatches);
    console.log("🔒 Final batch classifications locked!");

    // ✅ Save updated domain locks
    await browser.storage.local.set({ DOMAIN_LOCKS: updatedDomainLocks });

    // ✅ Log new domain locks for manual update
    console.log("📌 Updated DOMAIN_LOCKS for manual addition:");
    console.table(updatedDomainLocks);
}

// 🚀 Kick off batch classification automatically
batchClassifySites();

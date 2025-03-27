/**
 * @file backfillEmbeddings.js
 * @description Background embedding backfill for finalBatches.
 */

import { getEmbedding } from "../../models/transformers.js";
import { cacheEmbedding } from "./indexedDB.js";
import { getAllFinalBatches } from "./StorageManager.js";
import { initDB } from "./indexedDB.js";

export async function backfillEmbeddingsIfMissing() {
  console.log("🔁 backfillEmbeddingsIfMissing() triggered");

  // 1) Open DB with idb
  const db = await initDB();

  // 2) Start a read-only transaction
  const tx = db.transaction("embeddings", "readonly");
  const store = tx.objectStore("embeddings");

  // 3) Collect existing embedding titles
  const existingTitles = new Set();
  const allEmbeds = await store.getAll();  // This returns all { title, embedding, category }

  for (const entry of allEmbeds) {
    existingTitles.add(entry.title);
  }

  // 4) Check finalBatches for missing embeddings
  const finalBatches = await getAllFinalBatches();

  for (const domain in finalBatches) {
    const category = finalBatches[domain];
    const title = `Locked Category: ${domain} → ${category}`;

    // If no embedding exists for this domain yet, schedule one via requestIdleCallback
    if (!existingTitles.has(title)) {
      requestIdleCallback(async () => {
        try {
          const embedding = await getEmbedding(title);
          if (embedding) {
            await cacheEmbedding(title, embedding, category);
            console.log(`🧠 Backfilled embedding: ${title}`);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to backfill embedding for: ${title}`, err);
        }
      });
    }
  }

  console.log("✅ backfillEmbeddingsIfMissing() complete");
}


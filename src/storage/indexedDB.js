/**
 * @file indexedDB.js
 * @description Utility functions for IndexedDB and browser storage.
 */

import { openDB } from "idb";
import { parse } from "tldts";

const DB_NAME = "histofyDB";
const DB_VERSION = 3; // ⬅️ Make sure this version is up to date

const CLASSIFICATION_STORE = "classifications";
const EMBEDDING_STORE = "embeddings";
const VISIT_STORE = "visits";

/**
 * ✅ Initialize IndexedDB with stores:
 * - classifications
 * - embeddings
 * - visits
 * - visitDurations
 */
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CLASSIFICATION_STORE)) {
        db.createObjectStore(CLASSIFICATION_STORE, { keyPath: "title" });
      }
      if (!db.objectStoreNames.contains(EMBEDDING_STORE)) {
        db.createObjectStore(EMBEDDING_STORE, { keyPath: "title" });
      }
      if (!db.objectStoreNames.contains(VISIT_STORE)) {
        db.createObjectStore(VISIT_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // ✅ Add new store for visitDurations
      if (!db.objectStoreNames.contains("visitDurations")) {
        const store = db.createObjectStore("visitDurations", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("domain", "domain", { unique: false });
      }

      // Remove old userLabels store if it exists
      if (db.objectStoreNames.contains("userLabels")) {
        db.deleteObjectStore("userLabels");
      }
    },
  });
}

export async function getStoredCSV() {
  const storedCSV = await browser.storage.local.get("histofyUserCSV");

  console.log("📂 Checking stored CSV Data:", storedCSV);

  if (!storedCSV.histofyUserCSV) {
    console.warn("❌ No CSV data found in browser.storage.local!");
    return "Domain,Title,Category\n";
  }

  const cleanedCSV = storedCSV.histofyUserCSV
    .split("\n")
    .filter((line) => !line.includes("[User-labeled]"))
    .join("\n");

  return cleanedCSV;
}

export async function updateStoredCSV(domain, title, category) {
  let csvContent = await getStoredCSV();

  if (!csvContent.includes("Domain,Title,Category")) {
    csvContent = "Domain,Title,Category\n";
  }

  const timestamp = new Date().toISOString();
  const newEntry = `${domain},${title},${category},${timestamp}`;

  // Simple duplicate check
  if (!csvContent.includes(`${domain},${title},${category}`)) {
    csvContent += `${newEntry}\n`;
    await browser.storage.local.set({ histofyUserCSV: csvContent });
    console.log("📁 CSV updated in storage with new entry:", newEntry);
  } else {
    console.log("🔄 Entry already exists, skipping duplicate:", newEntry);
  }
}

export async function getAllVisits() {
  const db = await initDB();
  const tx = db.transaction(VISIT_STORE, "readonly");
  const store = tx.objectStore(VISIT_STORE);
  const visits = await store.getAll();
  await tx.done;
  return visits;
}

export async function updateIndexedDB(domain, category) {
  const db = await initDB();
  const transaction = db.transaction(CLASSIFICATION_STORE, "readwrite");
  const store = transaction.objectStore(CLASSIFICATION_STORE);

  let record = await store.get(domain);
  if (record) {
    record.category = category;
    store.put(record);
  }
}

/**
 * ✅ Attempt to find existing classification for a domain+title
 */
export async function getCachedClassification(domain, title) {
  if (!domain || !title) return null;
  const db = await initDB();

  // 1) Check if there's a record whose key is exactly `title`
  let cachedResult = await db.get(CLASSIFICATION_STORE, title);
  if (cachedResult) {
    return cachedResult.category;
  }

  // 2) Check if there's a record whose key is exactly `domain`
  cachedResult = await db.get(CLASSIFICATION_STORE, domain);
  if (cachedResult) {
    return cachedResult.category;
  }

  return null;
}

/**
 * ✅ Now takes an object with domain, url, title, category
 * Stores the record in `classifications` with keyPath = "title".
 */
export async function cacheClassification({ domain, url, title, category }) {
  if (!title || !category) return;
  const db = await initDB();

  // We'll store them together, but the `title` is still the "key".
  // If you prefer a domain-based key, you'd create a store with keyPath: "domain" instead.
  await db.put(CLASSIFICATION_STORE, {
    title,
    domain,
    url,
    category,
    updatedAt: Date.now(),
  });
}

export async function cacheEmbedding(title, embedding, category) {
  if (!title || !embedding || !category) return;
  const db = await initDB();
  await db.put(EMBEDDING_STORE, { title, embedding, category });

  const { histofyEmbeddingBackup } = await browser.storage.local.get(
    "histofyEmbeddingBackup"
  );
  const updated = histofyEmbeddingBackup || [];
  updated.push({ title, embedding, category });
  await browser.storage.local.set({ histofyEmbeddingBackup: updated });
  console.log(`💾 Backed up embedding to browser.storage.local: ${title}`);
}

export async function getMatchingEmbedding(newEmbedding) {
  if (!newEmbedding) return null;
  const db = await initDB();
  const allEmbeddings = await db.getAll(EMBEDDING_STORE);

  for (const entry of allEmbeddings) {
    const similarity = cosineSimilarity(entry.embedding, newEmbedding);
    if (similarity >= 0.9) {
      console.log(`🔄 Using cached classification for similar text: ${entry.title}`);
      return entry.category;
    }
  }
  return null;
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (normA * normB);
}

/* ------------------------------------------------------------------
   DEPRECATED USER LABELS
------------------------------------------------------------------- */
export async function setUserLabel() {
  console.warn("⚠️ setUserLabel() called, but user labels now belong in SQLite.");
}
export async function getUserLabel() {
  console.warn("⚠️ getUserLabel() called, but user labels now belong in SQLite.");
  return null;
}
export async function getAllUserLabels() {
  console.warn("⚠️ getAllUserLabels() called, but user labels now belong in SQLite.");
  return [];
}

/* ------------------------------------------------------------------
   REMOVE STALE CLASSIFICATIONS / EMBEDDINGS
------------------------------------------------------------------- */
export async function removeAllStaleForDomain(domain) {
  if (!domain) return;
  const db = await initDB();

  const allEmbeddings = await db.getAll(EMBEDDING_STORE);
  for (const entry of allEmbeddings) {
    if (entry.title.includes(`(Domain: ${domain})`)) {
      await db.delete(EMBEDDING_STORE, entry.title);
      console.log(`🗑 Removed stale embedding: ${entry.title}`);
    }
  }

  const allClassifications = await db.getAll(CLASSIFICATION_STORE);
  for (const entry of allClassifications) {
    if (entry.title.includes(`(Domain: ${domain})`)) {
      await db.delete(CLASSIFICATION_STORE, entry.title);
      console.log(`🗑 Removed stale classification: ${entry.title}`);
    }
  }
}

/**
 * 🛠 Dev Console Restore: window.recoverEmbeddingsFromBackup()
 */
window.recoverEmbeddingsFromBackup = async () => {
  const { histofyEmbeddingBackup } = await browser.storage.local.get(
    "histofyEmbeddingBackup"
  );
  if (!histofyEmbeddingBackup || !Array.isArray(histofyEmbeddingBackup)) {
    console.warn("⚠️ No embedding backup found.");
    return;
  }
  const db = await initDB();
  for (const entry of histofyEmbeddingBackup) {
    await db.put(EMBEDDING_STORE, entry);
  }
  console.log(`✅ Restored ${histofyEmbeddingBackup.length} embeddings from backup.`);
};

/**
 * ✅ Auto-restore if empty
 */
export async function loadEmbeddingRecoveryIfMissing() {
  const db = await initDB();
  const existing = await db.getAll(EMBEDDING_STORE);
  if (existing.length === 0) {
    const backup = await browser.storage.local.get("histofyEmbeddingBackup");
    if (backup.histofyEmbeddingBackup) {
      const entries = backup.histofyEmbeddingBackup;
      for (const entry of entries) {
        await db.put(EMBEDDING_STORE, entry);
      }
      console.log(`✅ Auto-restored ${entries.length} embeddings from backup.`);
    } else {
      console.warn("❌ No embedding backup found to restore from.");
    }
  } else {
    console.log("🧠 IndexedDB embeddings already loaded.");
  }
}

/**
 * ✅ Track visit duration for a domain
 * @param {string} domain - The root domain visited
 * @param {number} durationMs - Duration in milliseconds
 */
export async function trackVisitDuration(domain, durationMs) {
  if (!domain || typeof durationMs !== "number") return;

  try {
    const db = await initDB();
    const tx = db.transaction("visitDurations", "readwrite");
    const store = tx.objectStore("visitDurations");

    const rootDomain = parse(domain)?.domain;

    const entry = {
      domain: rootDomain || domain,
      duration: durationMs,
      timestamp: Date.now(),
    };

    await store.add(entry);
    await tx.done;
    console.log(`⏱️ Visit duration tracked: ${domain} - ${durationMs} ms`);
  } catch (err) {
    console.error("❌ Error tracking visit duration:", err);
  }
}

/**
 * ✅ Get raw list of visit durations (no aggregation)
 */
export async function getVisitDurations() {
  const db = await initDB();
  const visits = await db.getAll("visitDurations");

  return visits
    .filter((entry) => entry?.domain && typeof entry.duration === "number")
    .map(({ domain, duration, timestamp }) => ({
      domain,
      duration,
      timestamp,
    }));
}

export { initDB };

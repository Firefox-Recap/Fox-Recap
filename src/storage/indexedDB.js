/**
 * @file indexedDB.js
 * @description Utility functions for IndexedDB and browser storage.
 */

import { openDB } from "idb";

const DB_NAME = "histofyDB";
const DB_VERSION = 2;

const CLASSIFICATION_STORE = "classifications";
const EMBEDDING_STORE = "embeddings";
const VISIT_STORE = "visits";

export async function getStoredCSV() {
  const storedCSV = await browser.storage.local.get("histofyUserCSV");

  console.log("📂 Checking stored CSV Data:", storedCSV);

  if (!storedCSV.histofyUserCSV) {
    console.warn("❌ No CSV data found in browser.storage.local!");
    return "Domain,Title,Category\n"; // Default CSV header
  }

  const cleanedCSV = storedCSV.histofyUserCSV
    .split("\n")
    .filter(line => !line.includes("[User-labeled]"))
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

  if (!csvContent.includes(`${domain},${title},${category}`)) {
    csvContent += `${newEntry}\n`;
    await browser.storage.local.set({ histofyUserCSV: csvContent });
    console.log("📁 CSV updated in storage with new batch entry:", newEntry);
  } else {
    console.log("🔄 Entry already exists, skipping duplicate:", newEntry);
  }
}

/**
 * ✅ Initialize IndexedDB with 3 stores:
 * - classifications
 * - embeddings
 * - visits (NEW)
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
        db.createObjectStore(VISIT_STORE, { keyPath: "id", autoIncrement: true });
      }
      if (db.objectStoreNames.contains("userLabels")) {
        db.deleteObjectStore("userLabels");
      }
    },
  });
}

/**
 * ✅ NEW: Return all visit records for analytics
 */
export async function getAllVisits() {
  const db = await initDB();
  const tx = db.transaction(VISIT_STORE, 'readonly');
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

export async function getCachedClassification(domain, title) {
  if (!domain || !title) return null;
  const db = await initDB();

  let cachedResult = await db.get(CLASSIFICATION_STORE, title);
  if (cachedResult) return cachedResult.category;

  cachedResult = await db.get(CLASSIFICATION_STORE, domain);
  if (cachedResult) return cachedResult.category;

  return null;
}

export async function cacheClassification(title, category) {
  if (!title || !category) return;
  const db = await initDB();
  await db.put(CLASSIFICATION_STORE, { title, category });
}

export async function cacheEmbedding(title, embedding, category) {
  if (!title || !embedding || !category) return;
  const db = await initDB();
  await db.put(EMBEDDING_STORE, { title, embedding, category });

  const { histofyEmbeddingBackup } = await browser.storage.local.get("histofyEmbeddingBackup");
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
  const { histofyEmbeddingBackup } = await browser.storage.local.get("histofyEmbeddingBackup");
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

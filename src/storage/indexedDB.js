/**
 * @file indexedDB.js
 * @description This module provides a comprehensive set of utility functions for managing data storage using IndexedDB and browser local storage.
 *              It includes functionality for caching classifications and embeddings, managing and updating CSV data, and cleaning up stale or outdated data entries.
 *              The module is designed to initialize and maintain the "histofyDB" database with two primary object stores: "classifications" and "embeddings".
 *              Additionally, it ensures efficient data retrieval, updates, and storage operations, while offering compatibility with browser storage APIs.
 * @module storage/indexedDB
 */
import { openDB } from "idb";

const DB_NAME = "histofyDB";
const DB_VERSION = 2;

const CLASSIFICATION_STORE = "classifications";
const EMBEDDING_STORE = "embeddings";

export async function getStoredCSV() {
  const storedCSV = await browser.storage.local.get("histofyUserCSV");

  console.log("📂 Checking stored CSV Data:", storedCSV);

  if (!storedCSV.histofyUserCSV) {
    console.warn("❌ No CSV data found in browser.storage.local!");
    return "Domain,Title,Category\n"; // Default CSV header
  }

  // 🔥 Filter out rows that contain "[User-labeled]" if you want to exclude them
  const cleanedCSV = storedCSV.histofyUserCSV
    .split("\n")
    .filter(line => !line.includes("[User-labeled]"))
    .join("\n");

  return cleanedCSV;
}

/**
 * Appends a new classification entry to the CSV in browser.storage.local,
 * including a timestamp to differentiate entries.
 */
export async function updateStoredCSV(domain, title, category) {
  // 1️⃣ Get existing CSV data
  let csvContent = await getStoredCSV();

  if (!csvContent.includes("Domain,Title,Category")) {
    csvContent = "Domain,Title,Category\n";
  }

  // 2️⃣ Build the new entry (you can remove the timestamp if you don’t need it)
  const timestamp = new Date().toISOString(); // e.g. "2025-03-11T12:34:56.789Z"
  const newEntry = `${domain},${title},${category},${timestamp}`;

  // 3️⃣ Prevent duplicates & append
  if (!csvContent.includes(`${domain},${title},${category}`)) {
    csvContent += `${newEntry}\n`;
    await browser.storage.local.set({ histofyUserCSV: csvContent });
    console.log("📁 CSV updated in storage with new batch entry:", newEntry);
  } else {
    console.log("🔄 Entry already exists, skipping duplicate:", newEntry);
  }
}

/**
 * Initialize IndexedDB with two stores:
 * 1) classifications
 * 2) embeddings
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
      // Remove userLabels store if it existed
      if (db.objectStoreNames.contains("userLabels")) {
        db.deleteObjectStore("userLabels");
      }
    },
  });
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

/* ------------------------------------------------------------------
   CLASSIFICATION + EMBEDDINGS
------------------------------------------------------------------- */
export async function getCachedClassification(domain, title) {
  if (!domain || !title) return null;
  const db = await initDB();

  // Try fetching by exact title first
  let cachedResult = await db.get(CLASSIFICATION_STORE, title);
  if (cachedResult) return cachedResult.category;

  // If no match, try by domain
  cachedResult = await db.get(CLASSIFICATION_STORE, domain);
  if (cachedResult) return cachedResult.category;

  return null; // Default if nothing is found
}


export async function cacheClassification(title, category) {
  if (!title || !category) return;
  const db = await initDB();
  await db.put(CLASSIFICATION_STORE, { title, category });
}

/** 🏷 Store an embedding in the "embeddings" store */
export async function cacheEmbedding(title, embedding, category) {
  if (!title || !embedding || !category) return;
  const db = await initDB();
  await db.put(EMBEDDING_STORE, { title, embedding, category });
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

  // 1️⃣ Remove embeddings for this domain
  const allEmbeddings = await db.getAll(EMBEDDING_STORE);
  for (const entry of allEmbeddings) {
    if (entry.title.includes(`(Domain: ${domain})`)) {
      await db.delete(EMBEDDING_STORE, entry.title);
      console.log(`🗑 Removed stale embedding: ${entry.title}`);
    }
  }

  // 2️⃣ Remove classifications for this domain
  const allClassifications = await db.getAll(CLASSIFICATION_STORE);
  for (const entry of allClassifications) {
    if (entry.title.includes(`(Domain: ${domain})`)) {
      await db.delete(CLASSIFICATION_STORE, entry.title);
      console.log(`🗑 Removed stale classification: ${entry.title}`);
    }
  }
}

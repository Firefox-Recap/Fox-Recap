/**
 * @file sqlite.js
 * @description This module provides functionality for initializing and managing a SQLite database
 * in the browser using sql.js and IndexedDB for persistent storage. It includes methods for 
 * saving and retrieving categorized browsing history, managing user-labeled domain categories, 
 * and ensuring database readiness for other scripts.
 */
/* ------------------------------------------------------------------
  ✅ MODULE IMPORTS
------------------------------------------------------------------- */
import initSqlJs from "sql.js";
//import { updateStoredCSV } from "./indexedDB.js"; // If needed for CSV


let db = null;

// Exported Promise to let other scripts await DB readiness
export let dbReady = null;

/**
 * Initializes the SQLite database persistently using IndexedDB (browser.storage.local).
 */
const initDB = async () => {
  if (db) return; // If already initialized, skip

  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`,
  });

  const storedDb = await browser.storage.local.get("sqliteDB");
  if (storedDb.sqliteDB) {
    db = new SQL.Database(new Uint8Array(storedDb.sqliteDB));
    console.log("✅ Loaded database from storage (sqlite.js).");
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS categorizedHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        title TEXT,
        visitTime INTEGER,
        category TEXT
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS user_labels (
        domain TEXT PRIMARY KEY,
        category TEXT
      );
    `);

    console.log("✅ SQLite DB Initialized (sqlite.js).");
  }
};

/**
 * Saves a categorized history item to the database.
 */
export async function saveHistory(historyItem) {
  if (!db) {
    console.error("❌ DB not initialized in sqlite.js");
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO categorizedHistory (url, title, visitTime, category)
    VALUES (?, ?, ?, ?);
  `);
  stmt.run([historyItem.url, historyItem.title, historyItem.visitTime, historyItem.category]);
  stmt.free();

  console.log("✅ History item saved (sqlite.js):", historyItem);
}

/**
 * Retrieves the latest categorized history (last 100 entries).
 */
export function getHistory() {
  if (!db) {
    console.error("❌ DB not initialized in sqlite.js");
    return [];
  }

  const stmt = db.prepare(`
    SELECT h.url, h.title, h.visitTime,
      COALESCE(ul.category, h.category) AS category
    FROM categorizedHistory h
    LEFT JOIN user_labels ul
    ON ul.domain = (SELECT REPLACE(h.url, 'www.', '') FROM categorizedHistory WHERE url = h.url)
    ORDER BY h.visitTime DESC
    LIMIT 100;
  `);

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/* ------------------------------------------------------------------
   ✅ USER LABEL FUNCTIONS
------------------------------------------------------------------- */

/**
 * Stores or updates a user-labeled domain category.
 */
export async function setUserLabel(domain, category) {
  if (!db) return;
  const rootDomain = domain.split(".").slice(-2).join(".");

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_labels (domain, category)
    VALUES (?, ?);
  `);
  stmt.run([rootDomain, category]);
  stmt.free();

  console.log(`✅ User label set: ${rootDomain} -> ${category}`);
}

/**
 * Retrieves a user-labeled category for a given domain.
 */
export function getUserLabel(domain) {
  if (!db || !domain) return null;

  const stmt = db.prepare("SELECT category FROM user_labels WHERE domain = ?;");
  stmt.bind([domain]);

  let label = null;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    label = row.category;
  }
  stmt.free();

  // ✅ Ensure user label only overrides IndexedDB when explicitly set
  return label && label !== "Unknown" ? label : null;
}


/**
 * Retrieves all user-labeled categories.
 */
export function getAllUserLabels() {
  if (!db) {
    console.error("❌ DB not initialized in sqlite.js");
    return [];
  }

  const stmt = db.prepare("SELECT domain, category FROM user_labels;");
  const labels = [];
  while (stmt.step()) {
    labels.push(stmt.getAsObject());
  }
  stmt.free();
  return labels;
}

/* ------------------------------------------------------------------
   ✅ DATABASE INITIALIZATION
------------------------------------------------------------------- */
dbReady = (async () => {
  await initDB();
  console.log("✅ dbReady resolved (sqlite.js)");
})();

export default dbReady;

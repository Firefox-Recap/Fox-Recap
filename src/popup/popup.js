/**
 * @file popup.js
 * @description This file is responsible for rendering categorized browsing history data
 *              from IndexedDB and Local Storage. It provides functionality for users to
 *              edit categories and download history data as a CSV file. This popup is 
 *              intended for testing purposes and is not designed for production front-end use.
 * 
 * Features:
 * - Retrieves and displays browsing history grouped by domain.
 * - Allows users to edit categories for specific domains.
 * - Downloads categorized history data as a CSV file.
 * - Synchronizes with background updates to history data.
 * 
 * Note: This implementation is for testing and debugging purposes only.
 */
/**
 * popup.js
 * ------------------------------------------------
 * Renders categorized history data from IndexedDB & Local Storage.
 * Ensures locked classifications remain unchanged.
 * Allows users to edit categories, which are stored persistently.
 */

import { openDB } from "idb";

const DB_NAME = "histofyDB";
const CLASSIFICATION_STORE = "classifications";
const EMBEDDING_STORE = "embeddings";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ popup.js loaded - DOMContentLoaded");

  const historyList = document.getElementById("history-list");
  const loadingMessage = document.getElementById("loading-message");
  const downloadCsvBtn = document.getElementById("download-csv-btn");

  if (downloadCsvBtn) {
    console.log("✅ Found #download-csv-btn. Attaching click listener...");
    downloadCsvBtn.addEventListener("click", async () => {
      console.log("📂 CSV button clicked. Sending 'getCSV' message...");
      try {
        const result = await browser.runtime.sendMessage({ action: "getCSV" });
        if (result && result.csvData) {
          console.log("✅ CSV data received:", result.csvData);

          const blob = new Blob([result.csvData], { type: "text/csv" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = "histofy_data.csv";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          console.log("✅ CSV downloaded!");
        } else {
          console.warn("⚠️ No CSV data available.");
        }
      } catch (err) {
        console.error("❌ Error sending 'getCSV' message:", err);
      }
    });
  } else {
    console.error("❌ #download-csv-btn not found in popup.html");
  }

  async function getStoredClassifications() {
    const db = await openDB(DB_NAME);
    const classifications = await db.getAll(CLASSIFICATION_STORE);
    console.log("📂 Retrieved IndexedDB Classifications:", classifications);
    return classifications.reduce((acc, item) => {
      acc[item.title] = item.category;
      return acc;
    }, {});
  }

  async function getStoredEmbeddings() {
    const db = await openDB(DB_NAME);
    const embeddings = await db.getAll(EMBEDDING_STORE);
    console.log("🧠 Retrieved IndexedDB Embeddings:", embeddings);
    return embeddings.reduce((acc, item) => {
      acc[item.title] = item.category;
      return acc;
    }, {});
  }

  async function renderHistory() {
    loadingMessage.style.display = "block";
    loadingMessage.textContent = "⏳ Loading history...";
    historyList.innerHTML = "";

    try {
      const { historyLoading, historyData } = await browser.storage.local.get([
        "historyLoading",
        "historyData"
      ]);

      if (historyLoading) {
        return;
      }

      if (!historyData || historyData.length === 0) {
        loadingMessage.style.display = "none";
        historyList.innerHTML = "<li>No browsing history available.</li>";
        return;
      }

      // Retrieve stored classifications & embeddings from IndexedDB
      const storedClassifications = await getStoredClassifications();
      const storedEmbeddings = await getStoredEmbeddings();

      loadingMessage.style.display = "none";

      // Group by domain to avoid duplicates
      const groupedHistory = {};
      historyData.forEach(item => {
        if (!item.url) return;
        const domain = new URL(item.url).hostname.replace(/^www\./, "");

        let category = item.category || "Uncategorized";

        // 🔄 Prioritize classification sources
        if (storedClassifications[item.title]) {
          category = storedClassifications[item.title]; // ✅ Locked batch classification
        } else if (storedEmbeddings[item.title]) {
          category = storedEmbeddings[item.title]; // ✅ Embedding-based classification
        }

        if (!groupedHistory[domain]) {
          groupedHistory[domain] = {
            domain: domain,
            category: category,
            visitCount: 1
          };
        } else {
          groupedHistory[domain].visitCount++;
        }
      });

      // Convert object to sorted array by visit count
      const sortedHistory = Object.values(groupedHistory).sort((a, b) => b.visitCount - a.visitCount);

      // Render history items
      historyList.innerHTML = sortedHistory
        .map((item, index) => `
          <li>
            <strong>${item.domain}</strong> (${item.visitCount} visits) - 
            <span class="category">${item.category}</span>
            <button class="edit-btn" data-index="${index}" data-domain="${item.domain}">Edit</button>
          </li>
        `)
        .join("");

      // Attach event listeners to edit buttons
      document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", async (event) => {
          const domain = event.target.getAttribute("data-domain");
          editCategory(domain);
        });
      });

    } catch (err) {
      console.error("❌ Error rendering history:", err);
      loadingMessage.textContent = "❌ Error loading history.";
    }
  }

  async function editCategory(domain) {
    if (!domain) {
      console.error("❌ Cannot edit category: Domain is undefined.");
      return;
    }

    const { historyData } = await browser.storage.local.get("historyData");
    const site = historyData.find(item => new URL(item.url).hostname.replace(/^www\./, "") === domain);

    if (!site) {
      console.error(`❌ No matching history found for domain: ${domain}`);
      return;
    }

    const newCategory = prompt(`Edit category for ${domain}:`, site.category);
    if (newCategory) {
      await browser.runtime.sendMessage({
        action: "setUserLabel",
        domain: domain,
        category: newCategory
      });
      console.log(`🔄 User-labeled ${domain} -> ${newCategory}`);
      setTimeout(() => renderHistory(), 500);
    }
  }

  await renderHistory();

  // Re-render if background updates history data
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.historyData || changes.historyLoading)) {
      renderHistory();
    }
  });
});





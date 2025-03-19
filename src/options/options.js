import { getStoredCSV } from "../storage/indexedDB.js";

document.addEventListener("DOMContentLoaded", async () => {
  const exportButton = document.getElementById("export-csv");
  const statusMessage = document.getElementById("status");

  exportButton.addEventListener("click", async () => {
    try {
      statusMessage.textContent = "⏳ Retrieving CSV file...";

      // Retrieve stored CSV
      const csvContent = await getStoredCSV();

      if (csvContent.trim() === "Domain,Category") {
        statusMessage.textContent = "⚠️ No user-labeled data available.";
        return;
      }

      // Trigger download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "histofy_user_labels.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      statusMessage.textContent = "✅ CSV file downloaded successfully!";
    } catch (error) {
      console.error("❌ Error exporting CSV:", error);
      statusMessage.textContent = "❌ Failed to retrieve CSV.";
    }
  });
});


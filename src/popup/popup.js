function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function createTopVisitedSection(domains) {
  const container = document.createElement("div");
  container.className = "top-visited-container";
  container.innerHTML = `<h3>🔥 Top Visited Domains</h3>`;

  const list = document.createElement("ul");
  list.className = "top-visited-list";

  for (const { domain, visits, durationMs } of domains) {
    const item = document.createElement("li");
    item.textContent = `${domain} — ${visits} visit${visits !== 1 ? "s" : ""} — ${formatDuration(durationMs)} spent`;
    list.appendChild(item);
  }

  container.appendChild(list);
  return container;
}

function createCategoryTimeSection(categoryStats) {
  const container = document.createElement("div");
  container.className = "category-time-container";
  container.innerHTML = `<h3>🕒 Time Spent by Category</h3>`;

  const list = document.createElement("ul");
  list.className = "category-time-list";

  for (const { category, durationMs, percentage } of categoryStats) {
    const item = document.createElement("li");
    item.textContent = `${category} — ${formatDuration(durationMs)} (${percentage}%)`;
    list.appendChild(item);
  }

  container.appendChild(list);
  return container;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Top Domains
    const topResponse = await browser.runtime.sendMessage({
      action: "GET_TOP_VISITED_DOMAINS",
      limit: 10,
    });

    if (topResponse.success && Array.isArray(topResponse.data)) {
      console.log("✅ Top Domains (with duration):", topResponse.data);
      const section = createTopVisitedSection(topResponse.data);
      document.body.appendChild(section);
    } else {
      console.warn("⚠️ No top visited domain data found.");
    }

    // Category Time Breakdown
    const catResponse = await browser.runtime.sendMessage({
      action: "GET_TIME_SPENT_BY_CATEGORY",
    });

    if (catResponse.success && Array.isArray(catResponse.data)) {
      console.log("✅ Time Spent by Category:", catResponse.data);
      const section = createCategoryTimeSection(catResponse.data);
      document.body.appendChild(section);
    } else {
      console.warn("⚠️ No category time data found.");
    }
  } catch (err) {
    console.error("❌ Failed to render popup stats:", err);
  }
});

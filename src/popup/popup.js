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

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { success, data } = await browser.runtime.sendMessage({
      action: "GET_TOP_VISITED_DOMAINS",
      limit: 10,
    });

    if (success && Array.isArray(data)) {
      console.log("✅ Top Domains (with duration):", data);
      const section = createTopVisitedSection(data);
      document.body.appendChild(section);
    } else {
      console.warn("⚠️ No top visited domain data found.");
    }
  } catch (err) {
    console.error("❌ Failed to fetch top visited domains:", err);
  }
});



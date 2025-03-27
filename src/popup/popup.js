document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("top-domains-list");

  try {
    const response = await browser.runtime.sendMessage({
      action: "GET_TOP_VISITED_DOMAINS",
      limit: 10
    });

    if (!response || !response.success) {
      listEl.innerHTML = "<li>❌ Failed to get data.</li>";
      console.error("Failed to fetch domains:", response);
      return;
    }

    if (response.data.length === 0) {
      listEl.innerHTML = "<li>No domains found.</li>";
      return;
    }

    listEl.innerHTML = "";
    response.data.forEach(({ domain, visits }) => {
      const li = document.createElement("li");
      li.textContent = `${domain} — ${visits} visits`;
      listEl.appendChild(li);
    });

  } catch (err) {
    listEl.innerHTML = "<li>❌ Could not connect to background script.</li>";
    console.error("SendMessage error:", err);
  }
});



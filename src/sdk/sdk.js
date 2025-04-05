export const HistofySDK = {
  async getTopVisitedDomains(limit = 10) {
    const response = await browser.runtime.sendMessage({
      action: "GET_TOP_VISITED_DOMAINS",
      limit,
    });

    // 🔍 Deep log full response object
    console.log("📦 Full response from background:", response);

    // Ensure it's a proper object with expected structure
    if (typeof response === "object" && response?.success && Array.isArray(response.data)) {
      console.log("🌐 Raw top domains from SDK:", response.data);

      return response.data.map((item) => ({
        domain: item.domain || item.url || "unknown",
        visits: item.visits ?? item.count ?? 0,
        durationMs: item.durationMs ?? item.duration ?? 0,
        durationFormatted: item.durationFormatted ?? "",
      }));
    } else {
      console.warn("⚠️ Unexpected SDK response type:", typeof response, response);
    }

    return [];
  },

  async getVisitDurations() {
    const response = await browser.runtime.sendMessage({
      action: "GET_VISIT_DURATIONS",
    });
    return response?.success ? response.data : [];
  },

  async getAllVisits() {
    const response = await browser.runtime.sendMessage({
      action: "GET_ALL_VISITS",
    });
    return response?.success ? response.data : [];
  },

  async getCategoryDurations() {
    const response = await browser.runtime.sendMessage({
      action: "GET_CATEGORY_DURATIONS",
    });
    return response?.success ? response.data : [];
  },

  async getPeakBrowsingHours() {
    const response = await browser.runtime.sendMessage({
      action: "GET_PEAK_HOURS",
    });
    return response?.success ? response.data : [];
  },

  async getCSVData() {
    const response = await browser.runtime.sendMessage({
      action: "getCSV",
    });
    return response?.csvData || "";
  },

  async setUserLabel(domain, category) {
    const response = await browser.runtime.sendMessage({
      action: "setUserLabel",
      domain,
      category,
    });
    return response?.success;
  },

  async runBatchClassification() {
    const response = await browser.runtime.sendMessage({
      action: "runBatchClassification",
    });
    return response?.success;
  },

  async getCachedCategory(input) {
    const response = await browser.runtime.sendMessage({
      action: "GET_CACHED_CATEGORY",
      input,
    });
    return response?.success ? response.category : null;
  },

  async clearVisitDurations() {
    const response = await browser.runtime.sendMessage({
      action: "CLEAR_VISIT_DURATIONS",
    });
    return response?.success;
  },

  async getPeakDays() {
    const visits = await this.getVisitDurations();
    const totals = Array(7).fill(0);
    visits.forEach(({ timestamp, duration }) => {
      const day = new Date(timestamp).getDay();
      totals[day] += duration;
    });

    const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayLabels.map((day, i) => ({
      day,
      totalMs: totals[i],
    }));
  },

  async getPeakDaysByCategory() {
    const visits = await this.getVisitDurations();
    const classifications = await browser.storage.local.get("classifications").then(res => res.classifications || []);

    const domainToCategory = {};
    for (const entry of classifications) {
      try {
        let domain;
        if (entry.domain) {
          domain = entry.domain.replace(/^www\./, "");
        } else if (entry.url) {
          domain = new URL(entry.url).hostname.replace(/^www\./, "");
        } else if (entry.title && entry.title.includes(".")) {
          domain = entry.title.toLowerCase().replace(/^www\./, "").split(" ")[0];
        }
        if (domain && entry.category) domainToCategory[domain] = entry.category;
      } catch (e) {
        // skip bad entry
      }
    }

    const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const result = Array(7).fill(null).map(() => ({ total: 0, categories: {}, domains: {} }));

    for (const { timestamp, domain, duration } of visits) {
      if (!domain || typeof duration !== "number") continue;
      const dayIndex = new Date(timestamp).getDay();
      const category = domainToCategory[domain] || "Uncategorized";

      result[dayIndex].total += duration;
      result[dayIndex].categories[category] = (result[dayIndex].categories[category] || 0) + duration;

      if (!result[dayIndex].domains[category]) {
        result[dayIndex].domains[category] = new Set();
      }
      result[dayIndex].domains[category].add(domain);
    }

    return result.map((entry, i) => ({
      day: dayLabels[i],
      total: entry.total,
      categories: entry.categories,
      domains: Object.fromEntries(
        Object.entries(entry.domains).map(([cat, domains]) => [cat, Array.from(domains)])
      )
    }));
  },
};

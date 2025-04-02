export const HistofySDK = {
  async getTopVisitedDomains(limit = 10) {
    const response = await browser.runtime.sendMessage({
      action: "GET_TOP_VISITED_DOMAINS",
      limit,
    });
    return response.success ? response.data : [];
  },

  async getVisitDurations() {
    const response = await browser.runtime.sendMessage({
      action: "GET_VISIT_DURATIONS",
    });
    return response.success ? response.data : [];
  },

  async getAllVisits() {
    const response = await browser.runtime.sendMessage({
      action: "GET_ALL_VISITS",
    });
    return response.success ? response.data : [];
  },

  async getPeakBrowsingHours() {
    const response = await browser.runtime.sendMessage({
      action: "GET_PEAK_HOURS",
    });
    return response.success ? response.data : [];
  },

  async getCSVData() {
    const response = await browser.runtime.sendMessage({
      action: "getCSV",
    });
    return response.csvData || "";
  },

  async setUserLabel(domain, category) {
    const response = await browser.runtime.sendMessage({
      action: "setUserLabel",
      domain,
      category,
    });
    return response.success;
  },

  async runBatchClassification() {
    const response = await browser.runtime.sendMessage({
      action: "runBatchClassification",
    });
    return response.success;
  },

  async getCategoryDurations() {
    const response = await browser.runtime.sendMessage({
      action: "GET_CATEGORY_DURATIONS",
    });
    return response.success ? response.data : [];
  },

  async getCachedCategory(input) {
    const response = await browser.runtime.sendMessage({
      action: "GET_CACHED_CATEGORY",
      input,
    });
    return response.success ? response.category : null;
  },

  async clearVisitDurations() {
    const response = await browser.runtime.sendMessage({
      action: "CLEAR_VISIT_DURATIONS",
    });
    return response.success;
  },

  /**
   * 📆 Structured time spent by day of week (Sunday–Saturday)
   * @returns {Promise<Array<{ day: string, totalMs: number }>>}
   */
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

  /**
   * 📊 Time spent by day of week with category breakdowns + domains
   * @returns {Promise<Array<{ day: string, total: number, categories: { [category]: number }, domains: { [category]: string[] } }>>}
   */
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

export const HistofySDK = {
    /**
     * Get top visited domains by visit count and time spent.
     * @param {number} limit - Number of domains to return.
     * @returns {Promise<Array<{ domain: string, visits: number, durationMs: number }>>}
     */
    async getTopVisitedDomains(limit = 10) {
      const response = await browser.runtime.sendMessage({
        action: "GET_TOP_VISITED_DOMAINS",
        limit,
      });
      return response.success ? response.data : [];
    },
  
    /**
     * Get raw visit durations by domain (not aggregated).
     * @returns {Promise<Array<{ domain: string, duration: number }>>}
     */
    async getVisitDurations() {
      const response = await browser.runtime.sendMessage({
        action: "GET_VISIT_DURATIONS",
      });
      return response.success ? response.data : [];
    },
  
    /**
     * Get full user CSV data (domain, title, category, timestamp).
     * @returns {Promise<string>}
     */
    async getCSVData() {
      const response = await browser.runtime.sendMessage({
        action: "getCSV",
      });
      return response.csvData || "";
    },
  
    /**
     * Set a user label for a domain (manual override).
     * @param {string} domain
     * @param {string} category
     * @returns {Promise<boolean>}
     */
    async setUserLabel(domain, category) {
      const response = await browser.runtime.sendMessage({
        action: "setUserLabel",
        domain,
        category,
      });
      return response.success;
    },
  
    /**
     * Trigger batch classification manually.
     * @returns {Promise<boolean>}
     */
    async runBatchClassification() {
      const response = await browser.runtime.sendMessage({
        action: "runBatchClassification",
      });
      return response.success;
    },
  };
  
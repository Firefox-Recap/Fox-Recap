// mlEngine.js

export async function ensureEngineIsReady(tabId = null) {
    // 🚫 Guard against missing ML API
    if (!browser.trial?.ml) {
      console.warn("❌ ML API is not available in this environment (browser.trial.ml is undefined).");
      return;
    }
  
    const { engineCreated } = await browser.storage.session.get({ engineCreated: false });
    if (engineCreated) {
      console.log("🧠 ML engine already created.");
      return;
    }
  
    const listener = (progress) => {
      console.log("📡 ML Progress:", progress);
      if (tabId) {
        browser.tabs.sendMessage(tabId, { type: "progress", data: progress });
      }
    };
  
    browser.trial.ml.onProgress.addListener(listener);
  
    try {
      console.log("🧠 Creating ML engine...");
      await browser.trial.ml.createEngine({
        modelHub: "huggingface",
        taskName: "text-classification",
        modelId: "firefoxrecap/URL-TITLE-classifier",
        dtype: "q8"
      });
  
      await browser.storage.session.set({ engineCreated: true });
      console.log("✅ ML engine created.");
    } catch (err) {
      console.error("❌ Failed to initialize ML engine:", err);
      throw err;
    } finally {
      browser.trial.ml.onProgress.removeListener(listener);
    }
  }
  
  export async function classifyURLAndTitle(url, title) {
    const input = `${url}:${title}`;
    console.log("🧠 Classifying:", input);
  
    // 🚫 Guard here too
    if (!browser.trial?.ml) {
      throw new Error("❌ ML engine not available: browser.trial.ml is undefined.");
    }
  
    const result = await browser.trial.ml.runEngine({ args: [input] });
    console.log("✅ ML Result:", result);
  
    return result; // returns array of { label, score }
  }
  
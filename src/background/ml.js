import { saveCategories } from "./db.js";

const THRESHOLD = 0.5;

const displayMessage = async (tabId, message) => {
  if (typeof tabId !== "number") {
    console.warn(
      `displayMessage: invalid tabId (${tabId}), skipping injection. Message was:`,
      message
    );
    return;
  }
  await browser.tabs.executeScript(tabId, {
    code: `
      (function(msg){
        if(window.altTextModal) window.altTextModal.updateText(msg);
      })(${JSON.stringify(message)});
    `
  });
};

async function waitForMlApi() {
  while (typeof browser.trial?.ml?.createEngine !== 'function') {
    console.warn('️ ML runtime not yet available, retrying...');
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function ensureEngineIsReady(tabId) {
  await waitForMlApi();

  const mlApi = browser.trial.ml;
  const { engineCreated } = await browser.storage.session.get({ engineCreated: false });
  if (engineCreated) return true;

  const hasTrial = await browser.permissions.contains({
    permissions: ["trialML"],
  });
  if (!hasTrial) {
    const granted = await browser.permissions.request({
      permissions: ["trialML"],
    });
    if (!granted) {
      if (typeof tabId === "number") {
        await displayMessage(
          tabId,
          "Permission denied: cannot load AI models."
        );
      }
      throw new Error("User denied trialML");
    }
  }

  const listener = (data) => {
    if (typeof tabId === "number") {
      browser.tabs.sendMessage(tabId, { type: "progress", data });
    }
  };
  mlApi.onProgress.addListener(listener);

  try {
    await displayMessage(tabId, "Initializing ML model…");
    await mlApi.createEngine({
      modelHub: "huggingface",
      taskName: "text-classification",
      modelId: "firefoxrecap/URL-TITLE-classifier",
      dtype: "q8",
    });
    await browser.storage.session.set({ engineCreated: true });
    await displayMessage(tabId, "ML model ready!");
    return true;
  } catch (err) {
    if (typeof tabId === "number") {
      await displayMessage(tabId, `Initialization failed: ${err.message}`);
    }
    throw err;
  } finally {
    mlApi.onProgress.removeListener(listener);
  }
}

async function classifyURLAndTitle(url, title, tabId) {
  try {
    const textToClassify = `${url}: ${title}`;
    console.log("Classifying:", textToClassify);

    // first, make sure engine is ready
    const ready = await ensureEngineIsReady(tabId);
    if (!ready) {
      console.warn("Skipping classification, ML engine unavailable");
      return null;
    }

    // then grab the same mlApi
    const mlApi = browser.trial?.ml;
    if (!mlApi?.runEngine) {
      console.error("ML runtime missing runEngine()");
      return null;
    }

    const result = await mlApi.runEngine({
      args: [textToClassify],
      options: { top_k: null },
    });
    console.log("Classification result:", result);

    const categoriesToSave = result
      .filter(r => r.score >= THRESHOLD)
      .map(r => ({ label: r.label, score: r.score }));

    if (categoriesToSave.length > 0) {
      await saveCategories(url, categoriesToSave);
    } else {
      const defaultCategory = { label: "Uncategorized", score: 0 };
      await saveCategories(url, [defaultCategory]);
      console.log(`No categories above threshold (${THRESHOLD}), saved default category.`);
    }

    if (typeof tabId === "number") {
      if (categoriesToSave.length > 0) {
        await displayMessage(
          tabId,
          `Classified as: ${categoriesToSave[0].label} (${(categoriesToSave[0].score * 100).toFixed(2)}%)`
        );
      } else {
        await displayMessage(tabId, "Classified as: Uncategorized");
      }
    }

    return result;
  } catch (error) {
    console.error("Classification error:", error);
    if (typeof tabId === "number") {
      await displayMessage(tabId, `Error: ${error.message}`);
    }
    return null;
  }
}

export { classifyURLAndTitle, THRESHOLD, ensureEngineIsReady };




import { saveCategories } from "./db.js";

const THRESHOLD = 0.5;

const displayMessage = async (tabId, message) => {
    await browser.scripting.executeScript({
        target: { tabId },
        func: message => {
            const { altTextModal } = window;
            altTextModal.updateText(message);
        },
        args: [message],
    });
};

async function ensureEngineIsReady(tabId) {
    if (!browser.trial?.ml?.createEngine) {
        console.error("AI runtime unavailable");
        return;
    }
    const { engineCreated } = await browser.storage.session.get({ engineCreated: false });
    if (engineCreated) return;
    const hasTrial = await browser.permissions.contains({ permissions: ["trialML"] });
    if (!hasTrial) {
        const granted = await browser.permissions.request({ permissions: ["trialML"] });
        if (!granted) {
            await displayMessage(tabId, "Permission denied: cannot load AI models.");
            throw new Error("User denied trialML");
        }
    }

    const listener = data => browser.tabs.sendMessage(tabId, { type: "progress", data });
    browser.trial.ml.onProgress.addListener(listener);
    try {
        await displayMessage(tabId, "Initializing ML model...");
        await browser.trial.ml.createEngine({
            modelHub: "huggingface",
            taskName: "text-classification",
            modelId: "firefoxrecap/URL-TITLE-classifier",
            dtype: "q8",
        });
        await browser.storage.session.set({ engineCreated: true });
        await displayMessage(tabId, "ML model ready!");
    } catch (err) {
        await displayMessage(tabId, `Initialization failed: ${err.message}`);
        throw err;
    } finally {
        browser.trial.ml.onProgress.removeListener(listener);
    }
}

// Function to classify a URL and title
async function classifyURLAndTitle(url, title, tabId) {
    try {
        // Combine URL and title for classification
        const textToClassify = `${url}: ${title}`;
        console.log("Classifying:", textToClassify);

        // Ensure the ML engine is ready before running inference
        await ensureEngineIsReady(tabId);

        // Run the engine with the input text
        const result = await browser.trial.ml.runEngine({
            args: [textToClassify],
            options: { top_k: 3 },
        });

        console.log("Classification result:", result);

        // store classification in the DB
        await saveCategories(
            url,
            result.map(r => ({ label: r.label, score: r.score }))
        );

        await displayMessage(
            tabId,
            `Classified as: ${result[0].label} (${(result[0].score * 100).toFixed(2)}%)`
        );

        return result;
    } catch (error) {
        console.error("Classification error:", error);
        await displayMessage(tabId, `Error: ${error.message}`);
        return null;
    }
}

export { classifyURLAndTitle, THRESHOLD, ensureEngineIsReady };




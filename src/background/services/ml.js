async function waitForMlApi() {
  while (typeof browser.trial?.ml?.createEngine !== 'function') {
    console.warn('ML API not available make sure you have permissions');
    await new Promise((r) => setTimeout(r, 5000));
  }
}

/**
 * Ensure the ML engine is initialized exactly once.
 * Requests the "trialML" permission if needed, then creates the engine.
 * @returns {Promise<boolean>} true if engine is ready
 */
async function ensureEngineIsReady() {
  await waitForMlApi();
  const mlApi = browser.trial.ml;

  // Have we already created the engine this session?
  const {engineCreated = false} = await browser.storage.session.get({
    engineCreated: false,
  });
  if (engineCreated) return true;

  const hasPerm = await browser.permissions.contains({
    permissions: ['trialML'],
  });
  if (!hasPerm) {
    const granted = await browser.permissions.request({
      permissions: ['trialML'],
    });
    if (!granted) {
      throw new Error('Permission "trialML" denied by user');
    }
  }

  // Create the engine // currently hardcoded to use a specific model
  await mlApi.createEngine({
    modelHub: 'huggingface',
    taskName: 'text-classification',
    modelId: 'firefoxrecap/URL-TITLE-classifier',
    dtype: 'q8', // or fp32
  });

  // Mark as created so we skip this next time
  await browser.storage.session.set({engineCreated: true});
  return true;
}

/**
 * Classify a URL + page title into one or more labels.
 * Returns the raw array of { label, score } from the ML model if it meets the threshold.
 */
export async function classifyURLAndTitle(url, title, threshold) {
  await ensureEngineIsReady();
  const mlApi = browser.trial.ml;
  if (typeof mlApi.runEngine !== 'function') {
    throw new Error('ML runtime missing runEngine()');
  }
  const textToClassify = `${url}: ${title}`;
  console.log('ML classify:', textToClassify);
  const result = await mlApi.runEngine({
    args: [textToClassify],
    options: { top_k: null },
  });

  return result
    .filter((item) => item.score >= threshold)
    .map((item) => ({
      // treat null labels as "Uncategorized"
      label: item.label ?? 'Uncategorized',
      score: item.score,
    }));
}

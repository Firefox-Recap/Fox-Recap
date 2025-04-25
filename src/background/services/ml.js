import {MLENGINECONFIG} from "../../config";
async function waitForMlApi(timeout = 30000, interval = 1000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (typeof browser.trial?.ml?.createEngine === 'function') {
        return resolve();
      }
      if (Date.now() - start >= timeout) {
        return reject(new Error(`ML API did not appear within ${timeout}ms`));
      }
      setTimeout(check, interval);
    };
    check();
  });
}

export async function ensureEngineIsReady() {
  try {
    await waitForMlApi(30000, 500);
  } catch (err) {
    throw new Error('Failed to detect ML API: ' + err.message);
  }
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

  // Create the engine 
  await mlApi.createEngine(MLENGINECONFIG);

  // Mark as created so we skip this next time
  await browser.storage.session.set({engineCreated: true});
  return true;
}

/**
 * Classify a URL + page title into one or more labels.
 * Returns the raw array of { label, score } from the ML model if it meets the threshold.
 */
export async function classifyURLAndTitle(
  url,
  title,
  threshold,
  skipInit = false
) {
  if (!skipInit) {
    await ensureEngineIsReady();
  }
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

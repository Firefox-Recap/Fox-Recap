import { get as levenshteinDistance } from 'fast-levenshtein';
import { MLENGINECONFIG, ML_CACHE_SIMILARITY_THRESHOLD } from "../../config";
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

  // 1) Try the cache first
  const cached = await getCachedClassification(
    url,
    title,
    ML_CACHE_SIMILARITY_THRESHOLD
  );
  if (cached) {
    console.debug('ML cache hit:', url);
    return cached;
  }

  // 2) Fallback to ML engine
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

  const mapped = result
    .filter(item => item.score >= threshold)
    .map(item => ({
      label: item.label ?? 'Uncategorized',
      score: item.score,
    }));

  // 3) Store into cache for next time
  await addToCache(url, title, mapped);

  return mapped;
}

// Simple similarity: longest common substring ratio.
// Feel free to replace with e.g. Levenshtein or Jaro‐Winkler for better accuracy.
function stringSimilarity(a = '', b = '') {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return (maxLen - dist) / maxLen;
}

async function getCachedClassification(url, title, simThreshold = ML_CACHE_SIMILARITY_THRESHOLD) {
  const { cachedClassifications = [] } = await browser.storage.local.get({
    cachedClassifications: []
  });

  for (let entry of cachedClassifications) {
    let simUrl = stringSimilarity(url, entry.url);
    let simTitle = stringSimilarity(title, entry.title);
    if (Math.max(simUrl, simTitle) >= simThreshold) {
      return entry.labels;
    }
  }
  return null;
}

async function addToCache(url, title, labels) {
  const { cachedClassifications = [] } = await browser.storage.local.get({
    cachedClassifications: []
  });
  cachedClassifications.push({ url, title, labels });
  await browser.storage.local.set({ cachedClassifications });
}

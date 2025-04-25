/**
 * @fileoverview
 * ML service for classifying URLs and page titles.  
 * Provides caching, similarity checks, and engine initialization.
 */

import { get as levenshteinDistance } from 'fast-levenshtein';
import { MLENGINECONFIG, ML_CACHE_SIMILARITY_THRESHOLD } from "../../config";

/**
 * Polls until the browser.trial.ml API is available or times out.
 *
 * @param {number} [timeout=30000] - Max time to wait (ms).
 * @param {number} [interval=1000] - Polling interval (ms).
 * @returns {Promise<void>} Resolves when API is ready.
 * @throws {Error} If the API does not appear within the timeout.
 */
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

/**
 * Ensures the ML engine is created and ready.
 * Requests the `trialML` permission if needed.
 *
 * @async
 * @returns {Promise<boolean>} `true` once the engine is ready.
 * @throws {Error} On timeout, permission denial, or engine creation failure.
 */
export async function ensureEngineIsReady() {
  try {
    await waitForMlApi(30000, 500);
  } catch (err) {
    throw new Error('Failed to detect ML API: ' + err.message);
  }
  const mlApi = browser.trial.ml;

  const { engineCreated = false } = await browser.storage.session.get({
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

  await mlApi.createEngine(MLENGINECONFIG);
  await browser.storage.session.set({ engineCreated: true });
  return true;
}

/**
 * Classifies a URL and title into one or more labels using the ML engine or cache.
 *
 * @async
 * @param {string} url - The URL to classify.
 * @param {string} title - The page title.
 * @param {number} threshold - Minimum score to include a label.
 * @param {boolean} [skipInit=false] - If `true`, skips engine initialization.
 * @returns {Promise<Array<{label: string, score: number}>>} Classification results.
 * @throws {Error} If the ML runtime is unavailable.
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

/**
 * Computes a similarity ratio between two strings using Levenshtein distance.
 *
 * @param {string} [a=''] - First string.
 * @param {string} [b=''] - Second string.
 * @returns {number} A value between 0 (no match) and 1 (exact match).
 */
function stringSimilarity(a = '', b = '') {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return (maxLen - dist) / maxLen;
}

/**
 * Retrieves a cached classification if the URL or title similarity exceeds threshold.
 *
 * @async
 * @param {string} url
 * @param {string} title
 * @param {number} [simThreshold=ML_CACHE_SIMILARITY_THRESHOLD]
 * @returns {Promise<Array<{label: string, score: number}>|null>}
 */
async function getCachedClassification(url, title, simThreshold = ML_CACHE_SIMILARITY_THRESHOLD) {
  const { cachedClassifications = [] } = await browser.storage.local.get({
    cachedClassifications: []
  });

  for (const entry of cachedClassifications) {
    const simUrl = stringSimilarity(url, entry.url);
    const simTitle = stringSimilarity(title, entry.title);
    if (Math.max(simUrl, simTitle) >= simThreshold) {
      return entry.labels;
    }
  }
  return null;
}

/**
 * Adds a new classification result to the local storage cache.
 *
 * @async
 * @param {string} url
 * @param {string} title
 * @param {Array<{label: string, score: number}>} labels
 * @returns {Promise<void>}
 */
async function addToCache(url, title, labels) {
  const { cachedClassifications = [] } = await browser.storage.local.get({
    cachedClassifications: []
  });
  cachedClassifications.push({ url, title, labels });
  await browser.storage.local.set({ cachedClassifications });
}

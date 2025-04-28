/**
 * @fileoverview
 * Application-wide configuration constants used throughout Firefox Recap.
 */

/**
 * Number of milliseconds in one day.
 * @constant {number}
 */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Mapping of human-friendly time‑range keys to number of days.
 * @constant {Object.<string, number>}
 * @property {number} day   - 1 day.
 * @property {number} week  - 7 days.
 * @property {number} month - 30 days.
 */
export const DAYS_MAP = {
  day:   1,
  week:  7,
  month: 30,
};

/**
 * URL of the OISD blocklist wildcard domains list.
 * @constant {string}
 */
export const OISD_BLOCKLIST_URL = 'https://big.oisd.nl/domainswild';

/**
 * URL of the NSFW OISD blocklist wildcard domains list.
 * @constant {string}
 */
export const NSFW_OISD_BLOCKLIST_URL = 'https://nsfw.oisd.nl/domainswild';

/**
 * List of category labels used by the ML classifier and reporting.
 * @constant {string[]}
 */
export const CATEGORIES = [
  'News',
  'Entertainment',
  'Shop',
  'Chat',
  'Education',
  'Government',
  'Health',
  'Technology',
  'Work',
  'Travel',
  'Uncategorized',
];

/**
 * Default confidence threshold for ML model classification.
 * @constant {number}
 */
export const THRESHOLD = 0.5;

/**
 * Similarity ratio threshold for cache lookups in ML classification.
 * @constant {number}
 */
export const ML_CACHE_SIMILARITY_THRESHOLD = 0.75;

/**
 * Toggle to enable or disable concurrent ML classification tasks.
 * @constant {boolean}
 */
export const CONCURRENCY_ENABLED = true;

/**
 * Enable the main OISD blocklist.
 * @constant {boolean}
 */
export const BLOCKLIST_ENABLED = true;

/**
 * Enable the NSFW OISD blocklist.
 * @constant {boolean}
 */
export const NSFW_BLOCKLIST_ENABLED = false; // Set to true to enable

/**
 * Configuration object passed to the ML engine at initialization. look at this link for more information: https://huggingface.co/firefoxrecap/URL-TITLE-classifier
 * @constant {Object}
 * @property {string} modelHub  - Name of the model hub (e.g., 'huggingface').
 * @property {string} taskName  - Task identifier for the model (e.g., 'text‑classification').
 * @property {string} modelId   - Identifier of the specific model to load.
 * @property {string} dtype     - Data type to use for inference (e.g., 'q8' or 'fp32').
 */
export const MLENGINECONFIG = {
  modelHub: 'huggingface',
  taskName: 'text-classification',
  modelId: 'firefoxrecap/URL-TITLE-classifier',
  dtype: 'q8', // or 'fp32'
};

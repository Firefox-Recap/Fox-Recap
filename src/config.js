// milliseconds in one day
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

// default time‐ranges
export const DAYS_MAP = {
  day:   1,
  week:  7,
  month: 30,
};

// The link for the blocklist
export const OISD_BLOCKLIST_URL = 'https://big.oisd.nl/domainswild';

// Map scores to labels
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

// Threshhold for ML ENGINE 
export const THRESHOLD = 0.5

export const ML_CACHE_SIMILARITY_THRESHOLD = 0.8;

export const CONCURRENCY_ENABLED = true; 

export const MLENGINECONFIG = {
  modelHub: 'huggingface',
  taskName: 'text-classification',
  modelId: 'firefoxrecap/URL-TITLE-classifier',
  dtype: 'q8', // or 'fp32'
};

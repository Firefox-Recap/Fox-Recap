/**
 * @file domainLocks.js
 * @description Dynamically loads domain-to-category mappings from a JSON file.
 *              Used for batching and creating golden data cached into IndexedDB.
 * @module storage/domainLocks
 */
export let DOMAIN_LOCKS = {};

export async function loadDomainLocks() {
  try {
      const url = browser.runtime.getURL('storage/domainLocks.json');
      console.log('Resolved URL for domainLocks.json:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      DOMAIN_LOCKS = await response.json();
      console.log('✅ Domain locks loaded successfully:', DOMAIN_LOCKS);
  } catch (error) {
      console.error('❌ Failed to load domain locks:', error.message, error);
  }
}


  
  
  
import { db } from '../initdb.js'; 
import { classifyURLAndTitle } from './ml.js';

// database handlers this stores stuff in the database

// stores the items from the history api into database
export async function storeHistoryItems(items) {
  if (!items.length) return 0;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('historyItems', 'readwrite');
    const store = tx.objectStore('historyItems');
    let successCount = 0;

    items.forEach((item) => {
      const req = store.put({
        url: item.url,
        title: item.title,
        lastVisitTime: item.lastVisitTime,
        visitCount: item.visitCount,
        typedCount: item.typedCount,
      });
      req.onsuccess = () => {
        successCount++;
        if (successCount === items.length) {
          resolve(successCount);
        }
      };
      req.onerror = (e) =>
        console.error('Error storing history item:', e.target.error);
    });

    tx.onerror = (e) => reject(e.target.error);
  });
}

// stores the visit details for each url
export async function storeVisitDetails(url, visits) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('visitDetails', 'readwrite');
    const store = tx.objectStore('visitDetails');
    let successCount = 0;

    visits.forEach((v) => {
      const req = store.put({
        visitId: v.visitId,
        url,
        visitTime: v.visitTime,
        referringVisitId: v.referringVisitId,
        transition: v.transition,
      });
      req.onsuccess = () => {
        successCount++;
        if (successCount === visits.length) {
          resolve(successCount);
        }
      };
      req.onerror = (e) =>
        console.error('Error storing visit detail:', e.target.error);
    });

    tx.onerror = (e) => reject(e.target.error);
  });
}

// stores the classified categories for each url + title
export async function storeCategories(url, title, lastVisitTime) {
  try {
    const categories = await classifyURLAndTitle(url, title, 0.5);
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      // include lastVisitTime so we can filter later
      const req = store.put({ url, categories, lastVisitTime });
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Error classifying or storing categories:', error);
    return Promise.reject(error);
  }
}

import { jest } from '@jest/globals';
import 'fake-indexeddb/auto';
import * as db from '../../background/db.js';

describe('IndexedDB initialization', () => {
  beforeEach(() => {
    // Clear all databases between tests
    indexedDB = new IDBFactory();
  });

  test('should initialize database successfully', async () => {
    const database = await db.initDB();
    expect(database).toBeDefined();
    expect(database.name).toBe('firefoxRecapDB');
    expect(database.version).toBe(1);
  });

  test('should create required object stores and indexes', async () => {
    const database = await db.initDB();
    
    // Test historyItems object store
    const transaction = database.transaction('historyItems', 'readonly');
    const historyStore = transaction.objectStore('historyItems');
    expect(historyStore).toBeDefined();
    expect(historyStore.indexNames.contains('url')).toBe(true);
    expect(historyStore.indexNames.contains('lastVisitTime')).toBe(true);
    expect(historyStore.indexNames.contains('domain')).toBe(true);

    // Test visitDetails object store
    const visitTransaction = database.transaction('visitDetails', 'readonly');
    const visitsStore = visitTransaction.objectStore('visitDetails');
    expect(visitsStore).toBeDefined();
    expect(visitsStore.indexNames.contains('url')).toBe(true);
    expect(visitsStore.indexNames.contains('visitTime')).toBe(true);

    // Test categories object store
    const categoryTransaction = database.transaction('categories', 'readonly');
    const categoriesStore = categoryTransaction.objectStore('categories');
    expect(categoriesStore).toBeDefined();
    expect(categoriesStore.indexNames.contains('category')).toBe(true);
  });

  test('should handle database error', async () => {
    // Mock indexedDB.open to simulate an error
    const originalOpen = indexedDB.open;
    indexedDB.open = jest.fn(() => {
      const request = {};
      setTimeout(() => {
        request.onerror({ target: { error: new Error('Test DB error') } });
      }, 0);
      return request;
    });
    
    await expect(db.initDB()).rejects.toThrow();
    
    // Restore original function
    indexedDB.open = originalOpen;
  });
});
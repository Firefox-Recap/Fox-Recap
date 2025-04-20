import { db } from '../initdb.js';

export async function getCategoryTrends(days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const tx = db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');

    const entries = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    // Group by day and category
    const dailyTrends = new Map();
    
    entries
        .filter(entry => entry.lastVisitTime >= cutoff)
        .forEach(entry => {
            const day = new Date(entry.lastVisitTime).toISOString().slice(0, 10);
            const categories = entry.categories || [];

            if (!dailyTrends.has(day)) {
                dailyTrends.set(day, new Map());
            }
            
            categories.forEach(cat => {
                const label = typeof cat === 'string' ? cat : cat?.label;
                if (label) {
                    const dayMap = dailyTrends.get(day);
                    dayMap.set(label, (dayMap.get(label) || 0) + 1);
                }
            });
        });

    // Convert to time series format
    const trends = Array.from(dailyTrends.entries())
        .map(([date, categories]) => ({
            date,
            categories: Array.from(categories.entries())
                .map(([label, count]) => ({ label, count }))
                .sort((a, b) => b.count - a.count)
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return trends;
}
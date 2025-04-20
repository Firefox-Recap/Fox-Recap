import { db } from '../initdb.js';

export async function getVisitsPerHour(days) {
    // Calculate proper start/end times
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of current day
    const end = now.getTime();
    
    now.setHours(0, 0, 0, 0); // Start of current day
    const start = now.getTime() - ((days - 1) * 24 * 60 * 60 * 1000);
    
    const tx = db.transaction('visitDetails', 'readonly');
    const index = tx.objectStore('visitDetails').index('visitTime');
  
    // Get visits within exact time range
    const entries = await new Promise((resolve, reject) => {
      const req = index.getAll(IDBKeyRange.bound(start, end));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  
    // Init counters for each hour
    const hourCounts = Array(24).fill(0);
    let totalDays = days;
    
    // Count visits per hour and track unique days
    const seenDates = new Set();
    entries.forEach(({ visitTime }) => {
      const date = new Date(visitTime);
      const dateStr = date.toDateString();
      seenDates.add(dateStr);
      hourCounts[date.getHours()]++;
    });

    // Adjust total days to actual days with data
    totalDays = Math.max(1, seenDates.size);

    // Calculate average visits per hour across days
    return hourCounts.map((count, idx) => ({
      hour: idx + 1,
      count: Math.round((count / totalDays) * 100) / 100, // Round to 2 decimal places
      totalVisits: count
    }));
}
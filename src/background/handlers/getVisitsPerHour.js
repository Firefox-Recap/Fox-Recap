import { db } from '../initdb.js';

export async function getVisitsPerHour(days) {
    //Compute start & end timestamps
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const start = startDate.getTime();
    const end = endDate.getTime();

    // Fetch all visitDetails in one Dexie query
    const entries = await db.visitDetails
      .where('visitTime')
      .between(start, end, true, true)
      .toArray();

    // Aggregate counts
    const hourCounts = new Array(24).fill(0);
    const seenDates = new Set();

    for (const { visitTime } of entries) {
      const d = new Date(visitTime);
      hourCounts[d.getHours()]++;
      seenDates.add(d.toDateString());
    }

    const totalDays = Math.max(seenDates.size, 1);

    //  Build result array
    return hourCounts.map((totalVisits, hour) => ({
      hour: hour + 1,
      totalVisits,
      count: +(totalVisits / totalDays).toFixed(2)
    }));
}
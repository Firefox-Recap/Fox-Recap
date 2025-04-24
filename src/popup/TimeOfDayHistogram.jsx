import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const TimeOfDayHistogram = ({ data }) => {
  // Convert hour 0-23 to readable label
  const formattedData = data.map(item => ({
    hour: `${item.hour % 12 || 12}${item.hour < 12 ? 'am' : 'pm'}`,
    count: item.totalVisits
  }));

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeOfDayHistogram;

import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const RadarCategoryChart = ({ data }) => {
  // Find the maximum count to normalize the data
  const maxCount = Math.max(...data.map(item => item.count), 0);

  // Normalize the data (scale counts between 0 and 1)
  const normalizedData = data.map(item => ({
    ...item,
    normalizedCount: maxCount > 0 ? item.count / maxCount : 0,
    originalCount: item.count 
  }));

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={normalizedData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
          <PolarGrid stroke="#e0e0e0" /> 
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#666', fontSize: 12 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
          <Radar
            name="Visits"
            dataKey="normalizedCount"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.7} 
            strokeWidth={2} 
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid #ccc', borderRadius: '4px' }} // Style tooltip
            formatter={(value, name, props) => [`Original Count: ${props.payload.originalCount}`, null]} // Show original count
            labelFormatter={(label) => `Category: ${label}`} 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarCategoryChart;
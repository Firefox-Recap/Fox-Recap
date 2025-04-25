// import React from 'react';
// import {
//   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// } from 'recharts';

// const CategoryTrendsLineChart = ({ data }) => {
//   const categoryKeys = Object.keys(data[0] || {}).filter(key => key !== 'date');

//   return (
//     <div style={{ width: '100%', height: 400 }}>
//       <ResponsiveContainer>
//         <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="date" />
//           <YAxis />
//           <Tooltip />
//           <Legend />
//           {categoryKeys.map((key, idx) => (
//             <Line
//               key={key}
//               type="monotone"
//               dataKey={key}
//               stroke={`hsl(${idx * 47}, 70%, 50%)`}
//               strokeWidth={2}
//               dot={false}
//             />
//           ))}
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default CategoryTrendsLineChart;

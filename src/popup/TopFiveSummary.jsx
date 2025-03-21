import React from 'react';

const TopFiveSummary = ({ historyData, setView }) => {
  if (!historyData || historyData.length === 0) {
    return <div>No data available </div>;
  }
  
  const topFive = historyData.slice(0, 5);
  return (
    <div>
      <h1>Top 5 Websites</h1>
      <ol>
        {topFive.map((item, index) => (
          <li key={index}>
            {item.domain} - {item.visitCount} visits
          </li>
        ))}
      </ol>
      <button onClick={() => setView("chart")}>Show Chart</button>
    </div>
  );
};

export default TopFiveSummary;

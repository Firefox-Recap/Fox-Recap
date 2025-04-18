import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getRecapData } from '../sdk/firefoxrecapSDK';

const RecapView = ({ timeRange, onBack }) => {
  const [recap, setRecap] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRecapData(timeRange);
        setRecap(data);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [timeRange]);

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!recap) return <div style={{ color: '#fff', padding: '2rem' }}>Loading…</div>;

  const { history, topDomains, stats } = recap;
  const totalSites = history.length;
  const totalTimeSec = (stats.history?.totalTime || 0) * 1000; // if you track it
  const totalMins = Math.round(totalTimeSec/60000);

  return (
    <div style={{ color: '#fff', padding: '1.5rem' }}>
      <button onClick={onBack} className="home-btn">← Back</button>
      <h2>Recap: {timeRange}</h2>
      <p>Total sites visited: <strong>{totalSites}</strong></p>
      <p>Total time online: <strong>{totalMins} m</strong></p>
      <h3>Top Domains</h3>
      <ul>
        {topDomains.map((d,i) => (
          <li key={i}>
            {d.url || d.domain}: {d.count}
          </li>
        ))}
      </ul>
      {/* you can also call getTopCategories here or render charts */}
    </div>
  );
};

RecapView.propTypes = {
  timeRange: PropTypes.oneOf(['day','week','month']).isRequired,
  onBack: PropTypes.func.isRequired,
};

export default RecapView;
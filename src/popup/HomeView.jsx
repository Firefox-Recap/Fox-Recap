import React from 'react';

const HomeView = ({ onSelectTimeRange }) => (
  <>
    <h1 style={{ fontSize: "80px", padding: "0", margin: "0" }}>Firefox Recap</h1>
    <div className="btn-container">
      <button className="home-btn" onClick={() => onSelectTimeRange('day')}>Day</button>
      <button className="home-btn" onClick={() => onSelectTimeRange('week')}>Week</button>
      <button className="home-btn" onClick={() => onSelectTimeRange('month')}>Month</button>
    </div>
  </>
);

export default HomeView;

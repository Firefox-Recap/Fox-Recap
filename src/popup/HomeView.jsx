import React from 'react';

const HomeView = ({ handleTimePeriodClick }) => {
  return (
    <>
      <h1 style={{ fontSize: "80px", padding: "0", margin: "0" }}>Firefox Recap</h1>
      <div className="btn-container">
        <button className="home-btn" onClick={() => handleTimePeriodClick('day')}>Day</button>
        <button className="home-btn" onClick={() => handleTimePeriodClick('week')}>Week</button>
        <button className="home-btn" onClick={() => handleTimePeriodClick('month')}>Month</button>
      </div>
    </>
  );
};

export default HomeView;

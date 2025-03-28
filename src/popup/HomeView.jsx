import React from 'react';
import PropTypes from 'prop-types';

const HomeView = ({ onSelectTimeRange }) => (
  <>
    <video autoPlay muted loop style={{
      position: 'fixed',
      right: 0,
      bottom: 0,
      width: '100vw',   
      height: '100vh',  
      objectFit: 'cover',
      zIndex: -1
    }}>
      <source src="assets/videos/1.mp4" type="video/mp4"/>
      Your browser does not support HTML5 video.
    </video>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <h1 style={{ fontSize: "80px", padding: "0", margin: "0" }}>Firefox Recap</h1>
      <div className="btn-container">
        <button className="home-btn" onClick={() => onSelectTimeRange('day')}>Day</button>
        <button className="home-btn" onClick={() => onSelectTimeRange('week')}>Week</button>
        <button className="home-btn" onClick={() => onSelectTimeRange('month')}>Month</button>
      </div>
    </div>
  </>
);

HomeView.propTypes = {
  onSelectTimeRange: PropTypes.func.isRequired
};

export default HomeView;

import React from 'react';
import PropTypes from 'prop-types';
import './popup.css'; // define .spinner-overlay & .spinner in here

const HomeView = ({ onSelectTimeRange, loading }) => (
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
        {['day', 'week', 'month'].map(r => (
          <button
            key={r}
            className="home-btn"
            disabled={loading}
            onClick={() => onSelectTimeRange(r)}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner"/>
        </div>
      )}
    </div>
  </>
);

HomeView.propTypes = {
  onSelectTimeRange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default HomeView;
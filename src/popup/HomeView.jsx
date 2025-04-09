import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const HomeView = ({ onSelectTimeRange }) => {
  const buttonBase = {
    padding: '14px 36px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#fff',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1.5px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)',
    width: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'
  };

  const buttonHover = {
    background: 'rgba(255, 255, 255, 0.15)',
    boxShadow: '0 0 12px rgba(255,255,255,0.2)',
    transform: 'translateY(-2px)',
  };

  const [hovered, setHovered] = React.useState(null);

  return (
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
        <source src="assets/videos/1.mp4" type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '20px',
        zIndex: 1,
        }}>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            fontSize: "72px",
            margin: "0",
            color: "#fff",
            fontWeight: "800",
            lineHeight: "1.1"
          }}
        >
          Firefox Recap
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ fontSize: "22px", color: "#cccccc", marginTop: "10px", marginBottom: "40px" }}
        >
          Visualize your browsing trends and habits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.4 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {[
            { label: 'Day', emoji: '🕒', value: 'day' },
            { label: 'Week', emoji: '📅', value: 'week' },
            { label: 'Month', emoji: '📆', value: 'month' }
          ].map(({ label, emoji, value }) => (
            <button
              key={value}
              onClick={() => onSelectTimeRange(value)}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...buttonBase,
                ...(hovered === value ? buttonHover : {})
              }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </motion.div>
      </div>
    </>
  );
};

HomeView.propTypes = {
  onSelectTimeRange: PropTypes.func.isRequired
};

export default HomeView;

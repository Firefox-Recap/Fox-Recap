import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const HomeView = ({ onSelectTimeRange }) => {
  const [hovered, setHovered] = React.useState(null);
  const [permissionGranted, setPermissionGranted] = React.useState(false);
  const [aiReady, setAiReady] = React.useState(false);
  const [activatingAI, setActivatingAI] = React.useState(false);
  const [flareActive, setFlareActive] = React.useState(false);
  const [statusIndex, setStatusIndex] = React.useState(0);

  const statusMessages = [
    '🔄 Downloading AI model...',
    '⚙️ Initializing system...',
    '🧠 Activating intelligence...',
    '✅ Mozilla AI Ready',
  ];

  React.useEffect(() => {
    (async () => {
      const granted = await browser.permissions.contains({ permissions: ['trialML'] });
      setPermissionGranted(granted);
      const { hasEnabledAI } = await browser.storage.local.get('hasEnabledAI');
      if (granted && hasEnabledAI) {
        setAiReady(true);
        setStatusIndex(statusMessages.length - 1);
      }
    })();
  }, []);

  const requestPermission = async () => {
    setTimeout(() => window.close(), 100);
    await browser.permissions.request({ permissions: ['trialML'] });
  };

  const startAISequence = async () => {
    setActivatingAI(true);
    setStatusIndex(0);

    try {
      const result = await browser.runtime.sendMessage({ action: 'ENABLE_ML' });
      if (!result?.success) throw new Error(result?.error || "ML engine load failed");

      let i = 0;
      const interval = setInterval(() => {
        i++;
        setStatusIndex(i);
        if (i >= statusMessages.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setFlareActive(true);
            setTimeout(() => {
              setAiReady(true);
              setActivatingAI(false);
              setFlareActive(false);
              browser.storage.local.set({ hasEnabledAI: true });
            }, 1000);
          }, 600);
        }
      }, 1200);
    } catch (err) {
      console.error("❌ ML startup failed:", err);
      setActivatingAI(false);
    }
  };

  const showOrb = aiReady || activatingAI;
  const statusText = aiReady ? '✅ Mozilla AI Ready' : statusMessages[statusIndex];

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
            { label: 'Day', value: 'day' },
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' }
          ].map(({ label, value }) => (
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

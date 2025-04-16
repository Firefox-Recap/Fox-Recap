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
      <style>
        {`
          @keyframes intense-glow {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.05); opacity: 0.7; }
          }
        `}
      </style>

      {/* === Permission Overlay === */}
      {!permissionGranted && (
        <motion.div
          key="permission-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#000',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'Inter, sans-serif',
            color: '#00e0ff',
            textAlign: 'center'
          }}
        >
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #00e0ff 0%, transparent 70%)',
              animation: 'intense-glow 3s infinite',
              filter: 'blur(3px)',
              boxShadow: '0 0 80px rgba(0,224,255,0.4)',
              zIndex: 0
            }} />
            <img
              src="assets/images/firefox_night_logo.png"
              alt="Nightly Orb"
              style={{
                width: '120px',
                height: '120px',
                position: 'relative',
                zIndex: 1,
                borderRadius: '50%',
                boxShadow: '0 0 16px rgba(0,224,255,0.2)'
              }}
            />
          </div>

          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            🧠 To use Mozilla AI, please grant permission.
          </div>
          <div style={{ fontSize: '14px', opacity: 0.65, maxWidth: '360px', marginBottom: '24px' }}>
            Click below and allow access near your address bar. Then reopen this popup.
          </div>
          <button
            onClick={requestPermission}
            style={{
              padding: '14px 36px',
              fontSize: '18px',
              background: '#00e0ff',
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 12px #00e0ff99'
            }}
          >
            Grant Permission
          </button>
        </motion.div>
      )}

      {/* === Flare Explosion === */}
      <AnimatePresence>
        {flareActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.8 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 1 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'radial-gradient(circle, rgba(0,255,255,0.25), transparent 70%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* === Main UI === */}
      {permissionGranted && (
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
            fontFamily: 'Segoe UI, Inter, sans-serif'
          }}>
            <h1 style={{
              fontSize: "72px",
              margin: "0",
              color: "#fff",
              fontWeight: "800",
              lineHeight: "1.1",
              letterSpacing: '-1px',
            }}>
              Firefox Recap
            </h1>

            <p style={{
              fontSize: "22px",
              color: "#cccccc",
              marginTop: "10px",
              marginBottom: "40px"
            }}>
              Visualize your browsing trends and habits.
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: '48px',
              width: '100%',
              maxWidth: '960px',
            }}>
              <div style={{
                position: 'relative',
                width: '200px',
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {showOrb && (
                  <div style={{
                    position: 'absolute',
                    top: '-25px',
                    left: '-25px',
                    width: '250px',
                    height: '250px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,224,255,0.3), rgba(0,100,200,0.15))',
                    boxShadow: '0 0 60px 15px rgba(0,200,255,0.3)',
                    animation: 'intense-glow 3s infinite',
                    zIndex: 0,
                  }} />
                )}

                <img
                  src="assets/images/AI_emoji.png"
                  alt="Firefox Bot"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.4))',
                    position: 'relative',
                    zIndex: 1,
                  }}
                />

                {showOrb && (
                  <motion.div
                    key={statusIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      marginTop: '16px',
                      fontSize: '17px',
                      color: '#00eaff',
                      fontWeight: 600,
                      minHeight: '24px',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  >
                    {statusText}
                  </motion.div>
                )}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}>
                {[{ label: 'Day', emoji: '🕒', value: 'day' },
                  { label: 'Week', emoji: '📅', value: 'week' },
                  { label: 'Month', emoji: '📆', value: 'month' }
                ].map(({ label, emoji, value }) => (
                  <button
                    key={value}
                    onClick={() => onSelectTimeRange(value)}
                    onMouseEnter={() => setHovered(value)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      padding: '14px 36px',
                      fontSize: '18px',
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
                      boxShadow: hovered === value
                        ? '0 0 12px rgba(0,255,255,0.3)'
                        : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                      transform: hovered === value ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}

                {!aiReady && (
                  <button
                    onClick={startAISequence}
                    disabled={activatingAI}
                    style={{
                      marginTop: '20px',
                      padding: '18px 48px',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: '#fff',
                      background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                      transition: 'all 0.3s ease-in-out',
                      width: '260px',
                    }}
                  >
                    Enable AI Features
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

HomeView.propTypes = {
  onSelectTimeRange: PropTypes.func.isRequired
};

export default HomeView;

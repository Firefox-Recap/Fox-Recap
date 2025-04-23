import React, { useState, useEffect, useRef } from 'react';
import './popup.css';

const SlideShow = ({ setView, timeRange }) => {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const loadSlides = async () => {
      setLoading(true);
      const bg = browser.extension.getBackgroundPage();
      const daysMap = { day: 1, week: 7, month: 30 };
      const days = daysMap[timeRange] || 1;

      const slides = [];

      // Slide 1: Top visited sites
      const topSites = await bg.getMostVisitedSites(days, 3);
      slides.push({
        id: 'topSites',
        video: '/assets/videos/2.mp4',
        prompt: `Your top sites: ${[...new Set(topSites.map(s => new URL(s.url).hostname))].join(', ')}`,
        metric: false,
        metric_type: null,
      });

      // Slide 2: Time spent per site
      const timeSpent = await bg.getTimeSpentPerSite(days, 3);
      slides.push({
        id: 'timeSpent',
        video: '/assets/videos/3.mp4',
        prompt: `Most time spent on: ${[...new Set(timeSpent.map(s => new URL(s.url).hostname))].join(', ')}`,
        metric: false,
        metric_type: null,
      });

      // Slide 3: Recency/Frequency
      const recFreq = await bg.getRecencyFrequency(days, 3);
      slides.push({
        id: 'recencyFrequency',
        video: '/assets/videos/4.mp4',
        prompt: `Recent + frequent: ${recFreq.map(r => `${r.domain} (seen ${r.count}x)`).join(', ')}`,
        metric: false,
        metric_type: null,
      });

      // Slide 4: Visits per hour
      const visitsPerHour = await bg.getVisitsPerHour(days);
      const peakHour = visitsPerHour.reduce((a, b) => (a.totalVisits > b.totalVisits ? a : b));
      slides.push({
        id: 'visitsPerHour',
        video: '/assets/videos/5.mp4',
        prompt: `Most active at hour ${peakHour.hour}: ${peakHour.totalVisits} visits`,
        metric: false,
        metric_type: null,
      });

      setSlides(slides);
      setLoading(false);
    };

    loadSlides();
  }, [timeRange]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [index]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) {
    return (
      <div className="spinner-overlay">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => console.error("Error loading video:", e)}
      >
        {slides.length > 0 && <source src={slides[index].video} type="video/mp4" />}
      </video>

      <button
        onClick={() => setView('home')}
        style={{
          position: 'absolute',
          top: "10px",
          right: '10px',
          fontSize: '40px',
          border: 'none',
          background: 'transparent',
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        ×
      </button>

      <h1 style={{ color: "#fff", textAlign: "center", width: "100%", position: 'absolute', top: '50%' }}>
        {slides.length > 0 && slides[index].prompt}
      </h1>

      <button
        style={{ position: 'absolute', right: '10px', top: '300px' }}
        onClick={() => setIndex(index + 1)}
        disabled={index >= slides.length - 1}
      >
        NEXT
      </button>

      <button
        style={{ position: 'absolute', left: '10px', top: '300px' }}
        onClick={() => setIndex(index - 1)}
        disabled={index === 0}
      >
        BACK
      </button>
    </div>
  );
};

export default SlideShow;

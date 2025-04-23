import React, { useState, useEffect, useRef } from 'react';
import './popup.css';

const SlideShow = ({ setView, timeRange }) => {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  const backgroundVideos = [
    '/assets/videos/1.mp4', '/assets/videos/2.mp4', '/assets/videos/3.mp4',
    '/assets/videos/4.mp4', '/assets/videos/5.mp4', '/assets/videos/6.mp4',
    '/assets/videos/7.mp4', '/assets/videos/8.mp4', '/assets/videos/9.mp4',
    '/assets/videos/10.mp4'
  ];

  const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const shuffledVideos = shuffle([...backgroundVideos]);

  useEffect(() => {
    const loadSlides = async () => {
      setLoading(true);
      const bg = browser.extension.getBackgroundPage();
      const daysMap = { day: 1, week: 7, month: 30 };
      const days = daysMap[timeRange] || 1;

      const slides = [];

      slides.push({
        id: 'intro',
        video: shuffledVideos[0],
        prompt: `Here’s a recap of your browser activity for ${timeRange}.`,
        metric: false,
        metric_type: null
      });

      slides.push({
        id: 'totalVisits',
        video: shuffledVideos[1],
        prompt: 'Let’s take a look at how many websites you’ve visited.',
        metric: false,
        metric_type: null
      });

      const topSitesRaw = await bg.getMostVisitedSites(days, 10);
      const topDomains = [...new Set(topSitesRaw.map(s => {
        try {
          return new URL(s.url).hostname;
        } catch {
          return null;
        }
      }).filter(Boolean))].slice(0, 3);

      if (topDomains.length) {
        slides.push({
          id: 'topSites',
          video: shuffledVideos[2],
          prompt: `Your top sites: ${topDomains.join(', ')}`,
          metric: false,
          metric_type: null
        });
      }

      const timeSpent = await bg.getTimeSpentPerSite(days, 5);
      if (timeSpent.length) {
        slides.push({
          id: 'timeSpent',
          video: shuffledVideos[3],
          prompt: `Most time spent on: ${timeSpent.slice(0, 3).map(s => {
            try {
              return `${new URL(s.url).hostname} (${s.timeSpent} min)`;
            } catch {
              return null;
            }
          }).filter(Boolean).join(', ')}`,
          metric: false,
          metric_type: null
        });
      }

      const recFreq = await bg.getRecencyFrequency(days, 3);
      if (recFreq.length) {
        slides.push({
          id: 'recencyFrequency',
          video: shuffledVideos[4],
          prompt: `Recent & frequent: ${recFreq.map(r => `${r.domain} (seen ${r.count}x)`).join(', ')}`,
          metric: false,
          metric_type: null
        });
      }

      const visitsPerHour = await bg.getVisitsPerHour(days);
      const peakHour = visitsPerHour.reduce((a, b) => (a.totalVisits > b.totalVisits ? a : b));
      slides.push({
        id: 'visitsPerHour',
        video: shuffledVideos[5],
        prompt: `Most active at hour ${peakHour.hour}: ${peakHour.totalVisits} visits`,
        metric: false,
        metric_type: null
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

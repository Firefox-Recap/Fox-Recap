import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import HomeView from './HomeView';
import SlideShow from './SlideShow';
import promptsData from './prompts.json';

const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const Popup = () => {
  const [view, setView] = useState('home'); // "home" or "slides"
  const [timeRange, setTimeRange] = useState(null);
  const [topDomains, setTopDomains] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTopVisitedDomains = async () => {
      try {
        const { success, data } = await browser.runtime.sendMessage({
          action: "GET_TOP_VISITED_DOMAINS",
          limit: 10,
        });

        if (success && Array.isArray(data) && data.length > 0) {
          setTopDomains(data); // Store the fetched data in state
        } else {
          console.warn("⚠️ No top visited domain data found.");
        }
      } catch (err) {
        console.error("❌ Failed to fetch top visited domains:", err);
      }
    };

    fetchTopVisitedDomains();
  }, []);

  const handleTimeRangeSelect = async (range) => {
    setLoading(true);
    setTimeRange(range);
    setView('slides');
    setLoading(false);
  };

  return (
    <div className="container">
      {view === 'home' ? (
        <HomeView onSelectTimeRange={handleTimeRangeSelect} />
      ) : (
        <SlideShow 
          timeRange={timeRange} 
          setView={setView} 
          prompts={promptsData.prompts}
          topDomains={topDomains}  // Pass topDomains to SlideShow component
        />
      )}
      {/* {topDomains.length > 0 && (
        <div className="top-visited-container">
          <h3>🔥 Top Visited Domains</h3>
          <ul className="top-visited-list">
            {topDomains.map((domain, index) => (
              <li key={index}>
                {domain.domain} — {domain.visits} visit{domain.visits !== 1 ? 's' : ''} — {formatDuration(domain.durationMs)} spent
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);

// src/popup/popup.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import HomeView from './HomeView';
import SlideShow from './SlideShow';
import promptsData from './prompts.json';

const Popup = () => {
  const [view, setView] = useState('home'); // "home" or "slides"
  const [timeRange, setTimeRange] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleTimeRangeSelect = async (range) => { // Made this function async
    setLoading(true);
    setTimeRange(range);
    setView('slides');
    await fetchHistory(range);
    setLoading(false);
  };

  useEffect(() => {
    if (view !== "home") {
      fetchHistory(view);
    }
  }, [view]);

  const fetchHistory = useCallback(async (range) => {
    setLoading(true);
    try {
      const { historyLoading, historyData } = await browser.storage.local.get([
        "historyLoading",
        "historyData",
      ]);

      if (historyLoading) {
        return;
      }

      if (!historyData || historyData.length === 0) {
        setHistoryData([]);
      } else {
        const domainGroups = {};
        historyData.forEach((item) => {
          let domain;
          try {
            domain = new URL(item.url).hostname;
          } catch (e) {
            domain = item.url; // Fallback
          }
          if (!domainGroups[domain]) {
            domainGroups[domain] = {
              domain,
              category: item.category || "Uncategorized",
              visitCount: 0,
            };
          }
          domainGroups[domain].visitCount++;
        });

        const sortedHistory = Object.values(domainGroups).sort(
          (a, b) => b.visitCount - a.visitCount
        );

        setHistoryData(sortedHistory);

      }
    } catch (err) {
      console.error("❌ Error loading history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="container">
      {view === 'home' ? (
        <HomeView onSelectTimeRange={handleTimeRangeSelect} />
      ) : (
        <SlideShow 
          timeRange={timeRange} 
          setView={setView} 
          prompts={promptsData.prompts}
          historyData={historyData}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);

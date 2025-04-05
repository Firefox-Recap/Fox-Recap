import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import HomeView from './HomeView';
import SlideShow from './SlideShow';
import promptsData from './prompts.json';
import { HistofySDK } from '../sdk/sdk.js';

// ✅ Expose SDK for DevTools
if (typeof window !== 'undefined') {
  window.HistofySDK = HistofySDK;
  console.log("✅ HistofySDK is now available on window.HistofySDK");
}

const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const Popup = () => {
  const [view, setView] = useState('home');
  const [timeRange, setTimeRange] = useState(null);
  const [topDomains, setTopDomains] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ Trigger background flush
    if (typeof browser !== "undefined" && browser.runtime?.connect) {
      browser.runtime.connect({ name: "popup-init" });
    }

    const waitForBackgroundReady = async () => {
      for (let i = 0; i < 10; i++) {
        try {
          const bg = await browser.runtime.getBackgroundPage();
          if (bg?.isHistofyBackgroundReady) return true;
        } catch (err) {
          console.warn("⌛ Waiting for background to be ready...");
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      return false;
    };

    const fetchTopVisitedDomains = async () => {
      const ready = await waitForBackgroundReady();
      if (!ready) {
        console.error("❌ Background script not ready after timeout.");
        return;
      }

      try {
        const data = await HistofySDK.getTopVisitedDomains(10);
        console.log("🧪 Popup received data from SDK:", data);

        if (Array.isArray(data) && data.length > 0) {
          const hasDomain = data.every(item => typeof item.domain === "string");
          if (!hasDomain) {
            console.warn("⚠️ Some topDomains items are missing 'domain' field:", data);
          }
          setTopDomains(data);
        } else {
          console.warn("⚠️ No top visited domain data found or data malformed.");
        }
      } catch (err) {
        console.error("❌ Failed to fetch top visited domains:", err);
      }
    };

    // 🔥 TEST BACKGROUND CONNECTION
    browser.runtime.sendMessage({ action: "GET_TOP_VISITED_DOMAINS" }).then((res) => {
      console.log("🧪 TOP Domains: ", res);
    });

    // 🧠 Trigger top domain fetch after ready check
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
          topDomains={topDomains}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);

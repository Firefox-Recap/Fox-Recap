import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from "react-dom/client";
//import Slides from "./BackgroundSlider";
import HomeView from './HomeView';
import TopFiveSummary from './TopFiveSummary';
import ChartView from './ChartView';
//import promptsData from "./prompts.json";

const Popup = () => {
  const [view, setView] = useState("home");
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get a random prompt from the Education category
  // const educationPrompts = promptsData.prompts.topCategories.Education;
  // const randomPrompt = educationPrompts[Math.floor(Math.random() * educationPrompts.length)];

  useEffect(() => {
    if (view !== "home") {
      fetchHistory(view);
    }
  }, [view]);

  const fetchHistory = useCallback(async (period) => {
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
        console.log("Sorted history data:", sortedHistory);

      }
    } catch (err) {
      console.error("❌ Error loading history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view !== "home") {
      fetchHistory(view);
    }
  }, [view, fetchHistory]);

  const handleTimePeriodClick = async (period) => {
    setLoading(true);
    setView("topFive"); 
    await fetchHistory(period);
    setLoading(false);
  };

  return (
    <div className="container" style={{ position: "relative", height: "100vh" }}>
      {view === "home" && <HomeView setView={setView} handleTimePeriodClick={handleTimePeriodClick} />}
      {view === "topFive" && <TopFiveSummary historyData={historyData} setView={setView} />}
      {view === "chart" && <ChartView historyData={historyData} setView={setView} />}
      {loading && <p>Loading...</p>}
    </div>
  );  
};

const root = createRoot(document.getElementById("root"));
root.render(<Popup />);
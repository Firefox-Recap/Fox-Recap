import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import Slides from "./BackgroundSlider";
import promptsData from "./prompts.json";

const Popup = () => {
  const [view, setView] = useState("home"); // 'home', 'day', 'week', 'month', 'chart'
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get a random prompt from the Education category
  const educationPrompts = promptsData.prompts.topCategories.Education;
  const randomPrompt = educationPrompts[Math.floor(Math.random() * educationPrompts.length)];

  useEffect(() => {
    if (view !== "home") {
      fetchHistory(view);
    }
  }, [view]);

  async function fetchHistory(period) {
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
  }

  // View for the top 5 summary
  const TopFiveSummary = () => {
    const topFive = historyData.slice(0, 5);
    return (
      <div>
        <h1>Top 5 Websites</h1>
        <ol>
          {topFive.map((item, index) => (
            <li key={index}>
              {item.domain} - {item.visitCount} visits
            </li>
          ))}
        </ol>
        <button onClick={() => setView("chart")}>Show Chart</button>
      </div>
    );
  };

  // View for the Doughnut chart of top 10
  const ChartView = () => {
    const topTen = historyData.slice(0, 10);
    const doughnutData = {
      labels: topTen.map((item) => item.domain),
      datasets: [
        {
          label: "Visit Count",
          data: topTen.map((item) => item.visitCount),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#FFCD56",
            "#4BC0C0",
            "#36A2EB",
            "#FF6384",
          ],
          hoverBackgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#FFCD56",
            "#4BC0C0",
            "#36A2EB",
            "#FF6384",
          ],
        },
      ],
    };

    const options = {
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "white",
            font: {
              size: 14,
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };

    return (
      <div className="chart-container">
        <h2>Top 10 Websites Chart</h2>
        <Doughnut data={doughnutData} options={options} />
        <button onClick={() => setView("home")}>Back to Home</button>
      </div>
    );
  };

  return (
    <div className="container" style={{ position: "relative", height: "100vh" }}>
      {view === "home" ? (
        <>
          <h1 style={{ fontSize: "80px", padding: "0", margin: "0" }}>Firefox Recap</h1>
          <div className="btn-container">
            <button className="home-btn" onClick={() => setView("day")}>
              Day
            </button>
            <button className="home-btn" onClick={() => setView("week")}>
              Week
            </button>
            <button className="home-btn" onClick={() => setView("month")}>
              Month
            </button>
          </div>
        </>
      ) : view === "chart" ? (
        <ChartView />
      ) : view === "day" ? (
        // Pass the day-specific prompt to the Slides component
        <Slides setView={setView} dayPrompt={randomPrompt.text} />
      ) : (
        <TopFiveSummary />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<Popup />);

import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const [view, setView] = useState("home"); // 'home', 'day', 'week', 'month'
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

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
        // Group and count visits per domain
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

        // Convert object to array and sort by visit count
        const sortedHistory = Object.values(domainGroups).sort(
          (a, b) => b.visitCount - a.visitCount
        );

        // Filter by selected period (mock filter since actual filtering needs timestamps)
        const filteredHistory = sortedHistory.slice(0, period === "day" ? 5 : period === "week" ? 10 : 15);

        setHistoryData(filteredHistory);
      }
    } catch (err) {
      console.error("❌ Error loading history:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      {view === "home" ? (
        <>
          <h1 style={{fontSize: "80px",  padding: "0", margin: "0"}}>Firefox Recap</h1>
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
      ) : (
        <BrowsingSummary view={view} historyData={historyData} loading={loading} setView={setView} />
      )}
    </div>
  );
};  

const BrowsingSummary = ({ view, historyData, loading, setView }) => {
  return (
    <div>
      <h2>{view.charAt(0).toUpperCase() + view.slice(1)} Recap</h2>
      {loading ? (
        <p>⏳ Loading history...</p>
      ) : historyData.length === 0 ? (
        <p>No browsing history available.</p>
      ) : (
        <ul>
          {historyData.map((group, index) => (
            <li key={index}>
              <strong>{group.domain}</strong> ({group.visitCount} visits) -{" "}
              <em>{group.category}</em>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => setView("home")}>Back</button>
    </div>
  );
};

// Render React component
const root = createRoot(document.getElementById("root"));
root.render(<Popup />);

/*
====================================
❗ Original Code (Commented Out) ❗
====================================
This was the original implementation before the "Firefox Recap" landing page was added.
If you need to restore it, uncomment and adjust as needed.

const Popup = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);

      try {
        const { historyLoading, historyData } = await browser.storage.local.get([
          "historyLoading",
          "historyData",
        ]);

        if (historyLoading) {
          return; // Keep loading state active
        }

        if (!historyData || historyData.length === 0) {
          setHistoryData([]);
        } else {
          // Group and count visits per domain
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

          // Convert object to array and sort by visit count
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

    fetchHistory();

    // Listen for storage changes and update
    const onStorageChange = (changes, area) => {
      if (area === "local" && (changes.historyData || changes.historyLoading)) {
        fetchHistory();
      }
    };

    browser.storage.onChanged.addListener(onStorageChange);

    return () => {
      browser.storage.onChanged.removeListener(onStorageChange);
    };
  }, []);

  return (
    <div>
      <h1>Browsing History</h1>
      {loading ? (
        <p>⏳ Loading history...</p>
      ) : historyData.length === 0 ? (
        <p>No browsing history available.</p>
      ) : (
        <ul>
          {historyData.map((group, index) => (
            <li key={index}>
              <strong>{group.domain}</strong> ({group.visitCount} visits) -{" "}
              <em>{group.category}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

*/


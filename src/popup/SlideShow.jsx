import React, { useState, useEffect, useRef } from 'react';
import './popup.css';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import promptsData from "./prompts.json";
import RadarCategoryChart from './RadarCategoryChart';
import TimeOfDayHistogram from './TimeOfDayHistogram';
import WavyText from './WavyText';
import ProgressBar from './ProgressBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as LineContainer } from 'recharts';

// Utility function for making safe background calls
const safeCallBackground = async (action, payload = {}) => {
  try {
    const response = await browser.runtime.sendMessage({ action, ...payload });
    return response;
  } catch (error) {
    console.error(`[callBackground error: ${action}]`, error);
    return null;
  }
};

// Constants for time ranges
const timeRangeMap = { day: "today", week: "this week", month: "this month" };

// Helper function to pick a random prompt from the promptsData
const pickPrompt = (section, replacements = {}) => {
  const options = promptsData.prompts[section] || [];
  if (!options.length) return '';
  const template = options[Math.floor(Math.random() * options.length)].text;
  return Object.entries(replacements).reduce(
    (result, [key, val]) => result.replaceAll(`[${key}]`, val),
    template
  );
};

// Helper function for shuffling an array
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const SlideShow = ({ setView, timeRange }) => {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [notEnoughData, setNotEnoughData] = useState(false);
  const videoRef = useRef(null);

  // Background videos to be shuffled for each slideshow
  const backgroundVideos = [
    '/assets/videos/1.mp4', '/assets/videos/2.mp4', '/assets/videos/3.mp4',
    '/assets/videos/4.mp4', '/assets/videos/5.mp4', '/assets/videos/6.mp4',
    '/assets/videos/7.mp4', '/assets/videos/8.mp4', '/assets/videos/9.mp4',
    '/assets/videos/10.mp4'
  ];

  // Fetch and display slideshow data based on the selected time range
  useEffect(() => {
    const loadSlides = async () => {
      setLoading(true);
      const daysMap = { day: 1, week: 7, month: 30 };
      const days = daysMap[timeRange] || 1;
    
      console.log("[SlideShow] Fetching and storing history...");
      await safeCallBackground("fetchAndStoreHistory", { days });
      console.log("[SlideShow] History fetch complete, loading slides...");
    
      const slides = [];
      const videos = shuffle([...backgroundVideos]);
      slides.push({
        id: 'intro',
        video: videos[0],
        prompt: pickPrompt("introRecap", { x: timeRangeMap[timeRange] })
      });
    
      slides.push({
        id: 'totalVisits',
        video: videos[1],
        prompt: pickPrompt("introToTotalWebsites", { x: timeRangeMap[timeRange] })
      });
    
      // Unique websites
      const totalUnique = await safeCallBackground("getUniqueWebsites", { days });
      if (!totalUnique || totalUnique === 0) {
        setNotEnoughData(true);
        setLoading(false);
        setProgress(100);
        return;
      }
    
      slides.push({
        id: 'totalWebsites',
        video: videos[2],
        prompt: pickPrompt("totalWebsites", {
          x: totalUnique.toLocaleString(),
          d: timeRangeMap[timeRange]
        })
      });
    
      // Adding daily visit count chart if the time range is not 'day'
      if (timeRange !== 'day') {
        const dailyData = await safeCallBackground("getDailyVisitCounts", { days }) || [];
        if (dailyData.length) {
          slides.push({
            id: 'dailyVisitsChart',
            video: null,
            prompt: 'Your daily visit counts over time 📅',
            chart: (
              <LineContainer width="100%" height={300}>
                <LineChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" />
                </LineChart>
              </LineContainer>
            )
          });
        }
      }
    
      // Top 3 visited websites, deduplicated
      const topSitesRaw = await safeCallBackground("getMostVisitedSites", { days, limit: 10 }) || [];
      const topDomains = [...new Set(topSitesRaw.map(s => {
        try { return new URL(s.url).hostname; } catch { return null; }
      }).filter(Boolean))].slice(0, 3);
    
      if (topDomains.length) {
        slides.push({
          id: 'topSites',
          video: videos[3],
          prompt: pickPrompt("top3Websites", { TopSites: topDomains.join(', ') })
        });
      }
    
      // Recency-Frequency
      const rfStats = await safeCallBackground("getRecencyFrequency", { days, limit: 1 }) || [];
      if (rfStats.length) {
        const topDomain = rfStats[0];
        slides.push({
          id: 'recencyFrequency',
          video: videos[0],
          prompt: pickPrompt("recencyFrequency", {
            Domain: topDomain.domain,
            Count: topDomain.count,
            DaysSince: topDomain.daysSince.toFixed(1)
          })
        });
      }
    
      // Most common jump
      const transitions = await safeCallBackground("getTransitionPatterns", { days }) || {};
      if (transitions.summary?.topPattern) {
        const { from, to, count } = transitions.summary.topPattern;
        let fromDomain, toDomain;
        try { fromDomain = new URL(from).hostname; } catch { fromDomain = from; }
        try { toDomain = new URL(to).hostname; } catch { toDomain = to; }
    
        slides.push({
          id: 'topTransition',
          video: videos[1],
          prompt: pickPrompt("mostCommonJump", {
            From: fromDomain,
            To: toDomain,
            Count: count
          })
        });
      }
    
      // Peak hour
      const visitsPerHour = await safeCallBackground("getVisitsPerHour", { days }) || [];
      let peakHour = visitsPerHour.length
        ? visitsPerHour.reduce((a, b) => a.totalVisits > b.totalVisits ? a : b)
        : { hour: 0, totalVisits: 0 };
    
      slides.push({
        id: 'visitsPerHour',
        video: videos[4],
        prompt: pickPrompt("peakBrowsingTime", {
          Start: `${(peakHour.hour % 12) || 12}${peakHour.hour < 12 ? 'am' : 'pm'}`,
          End: `${((peakHour.hour + 1) % 12) || 12}${(peakHour.hour + 1) < 12 ? 'am' : 'pm'}`,
          Count: peakHour.totalVisits
        })
      });
    
      if (visitsPerHour.length) {
        slides.push({
          id: 'visitsPerHourChart',
          video: null,
          prompt: 'Your browsing activity by hour ⏰',
          chart: <TimeOfDayHistogram data={visitsPerHour} />
        });
      }
    
      // Busiest day
      const dailyCounts = await safeCallBackground("getDailyVisitCounts", { days }) || [];
      const busiestDay = dailyCounts.sort((a, b) => b.count - a.count)[0];
      if (busiestDay) {
        slides.push({
          id: 'busiestDay',
          video: videos[5],
          prompt: pickPrompt("busiestDay", { Date: busiestDay.date, Count: busiestDay.count })
        });
      }
    
      // Top category
      const labelCounts = await safeCallBackground("getLabelCounts", { days }) || [];
      const nonZero = labelCounts.filter(c => c.count > 0);
      const topCategory = nonZero.length
        ? nonZero.reduce((max, c) => c.count > max.count ? c : max)
        : null;

      if (topCategory) {
        slides.push({
          id: 'topCategory',
          video: videos[6],
          prompt: pickPrompt("topCategory", {
            Category: topCategory.categories[0],
            Count: topCategory.count
          })
        });
      
        slides.push({
          id: 'topCategoryRadar',
          video: null,
          prompt: "Here's how your categories stack up 📊",
          chart: <RadarCategoryChart data={labelCounts.map(c => ({
            category: c.categories[0],
            count: c.count
          }))} />
        });
      } else {
        console.warn("[SlideShow] No top category with nonzero count found.");
      }
    
      // Category trends
      const trends = await safeCallBackground("getCategoryTrends", { days }) || [];
      if (trends.length) {
        const topDay = trends.reduce((max, day) =>
          day.categories[0].count > (max.categories[0]?.count || 0) ? day : max
        );
        slides.push({
          id: 'categoryTrends',
          video: videos[9],
          prompt: pickPrompt("trendingCategory", {
            Category: topDay.categories[0].label,
            Date: topDay.date,
            Count: topDay.categories[0].count
          })
        });
      }
    
      // Co-occurrence
      const coCounts = await safeCallBackground("getCOCounts", { days }) || [];
      const topCoPairs = coCounts.filter(([, , count]) => count > 0).sort((a, b) => b[2] - a[2]);
      if (topCoPairs.length) {
        const [catA, catB, count] = topCoPairs[0];
        slides.push({
          id: 'topCoOccurrenceText',
          video: videos[8],
          prompt: `Your strongest category pair 🔗 ${catA} and ${catB} showed up together ${count} times in your browsing — your most frequent pairing!`
        });
      }
    
      // SUMMARY
      let summaryLines = [];
      summaryLines.push(`✨ Recap Summary ✨`);
      summaryLines.push(`🌐 Unique websites: ${totalUnique.toLocaleString()}`);
      if (topCategory) summaryLines.push(`🏆 Favorite category: ${topCategory.categories[0]}`);
      if (topDomains.length) summaryLines.push(`🔥 Top site: ${topDomains[0]}`);
      summaryLines.push(`⏰ Peak hour: ${(peakHour.hour % 12) || 12}${peakHour.hour < 12 ? 'am' : 'pm'}`);
      
      slides.push({
        id: 'recapSummary',
        video: videos[6],
        prompt: (
          <div style={{ color: '#fff', textAlign: 'center' }}>
            {summaryLines.map((line, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>{line}</div>
            ))}
          </div>
        )
      });

      setSlides(slides);
      setNotEnoughData(false);
      setLoading(false);
      setProgress(100);
    };

    loadSlides();
  }, [timeRange]);

  // Simulating loading progress
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 5 : prev));
    }, 200);
    return () => clearInterval(interval);
  }, [loading]);

  // Handling video load
  useEffect(() => {
    if (videoRef.current) videoRef.current.load();
  }, [index]);

  // Automatically transition to the next slide after 5 seconds
  useEffect(() => {
    if (loading || notEnoughData) return;
    const timer = setTimeout(() => {
      setIndex(prev => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 5000);

    return () => clearTimeout(timer);
  }, [index, slides.length, loading, notEnoughData]);

  // Loading screen
  if (loading || progress < 100) {
    return (
      <div className="loading-screen">
        <div className="center-container">
          <WavyText text="Preparing your recap..." />
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  // "Not enough data" screen
  if (notEnoughData) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '2rem', boxSizing: 'border-box' }}>
        <h1 style={{ color: '#fff', textAlign: 'center', marginTop: '35vh' }}>Not enough browsing history yet. Your recap will be ready once you’ve explored a bit more!</h1>
      </div>
    );
  }

  // Main slideshow UI
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <ProgressBar
        currentIndex={index}
        slideCount={slides.length}
        durationMs={5000}
      />
      <video ref={videoRef} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
        {slides[index]?.video && <source src={slides[index].video} type="video/mp4" />}
      </video>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '2rem', boxSizing: 'border-box' }}>
        {slides[index]?.chart ? (
          <>
            <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '1rem' }}>{slides[index].prompt}</h1>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100% - 100px)' }}>
              {slides[index].chart}
            </div>
          </>
        ) : (
          <h1 style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            maxWidth: '90%',
            textAlign: 'center',
            margin: 0,
            padding: '0 2rem',
            boxSizing: 'border-box',
          }}>{slides[index]?.prompt}</h1>
        )}
      </div>

      <button onClick={() => setIndex(index + 1)} disabled={index >= slides.length - 1} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', zIndex: 10 }}><FaArrowRight /></button>
      <button onClick={() => setIndex(index - 1)} disabled={index === 0} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', zIndex: 10 }}><FaArrowLeft /></button>
    </div>
  );
};

export default SlideShow;


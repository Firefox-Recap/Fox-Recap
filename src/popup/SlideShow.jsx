import React, { useState, useEffect, useRef } from 'react';
import './popup.css';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import promptsData from "./prompts.json";
import RadarCategoryChart from './RadarCategoryChart';
import TimeOfDayHistogram from './TimeOfDayHistogram';
import WavyText from './WavyText';
import CategoryTrendsLineChart from './CategoryTrendsLineChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as LineContainer } from 'recharts';

const safeCallBackground = async (action, payload = {}) => {
  try {
    const response = await browser.runtime.sendMessage({ action, ...payload });
    return response;
  } catch (error) {
    console.error(`[callBackground error: ${action}]`, error);
    return null;
  }
};


const SlideShow = ({ setView, timeRange }) => {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [notEnoughData, setNotEnoughData] = useState(false);
  const videoRef = useRef(null);

  const backgroundVideos = [
    '/assets/videos/1.mp4', '/assets/videos/2.mp4', '/assets/videos/3.mp4',
    '/assets/videos/4.mp4', '/assets/videos/5.mp4', '/assets/videos/6.mp4',
    '/assets/videos/7.mp4', '/assets/videos/8.mp4', '/assets/videos/9.mp4',
    '/assets/videos/10.mp4'
  ];

  const timeRangeMap = { day: "today", week: "this week", month: "this month" };

  const pickPrompt = (section, replacements = {}) => {
    const options = promptsData.prompts[section] || [];
    if (!options.length) return '';
    const template = options[Math.floor(Math.random() * options.length)].text;
    return Object.entries(replacements).reduce(
      (result, [key, val]) => result.replaceAll(`[${key}]`, val),
      template
    );
  };

  const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

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
        prompt: pickPrompt("introRecap", { x: timeRangeMap[timeRange] }),
        metric: false,
      });

      slides.push({
        id: 'totalVisits',
        video: videos[1],
        prompt: pickPrompt("introToTotalWebsites", { x: timeRangeMap[timeRange] }),
        metric: false,
      });

      const totalUnique = await safeCallBackground("getUniqueWebsites", { days });

      // see if theres any data, if not skip slides
      if (!totalUnique || totalUnique === 0) {
        console.log("[SlideShow] Not enough data (totalUnique=0).");
        setNotEnoughData(true);
        setLoading(false);
        setProgress(100);
        return;
      }
      
      slides.push({
        id: 'totalWebsites',
        video: videos[2],
        prompt: `You visited ${typeof totalUnique === 'number' ? totalUnique.toLocaleString() : '0'} unique websites ${timeRangeMap[timeRange]}.`,
        metric: true,
      });

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

      const topSitesRaw = await safeCallBackground("getMostVisitedSites", { days, limit: 3 }) || [];
      const topDomains = topSitesRaw.map(s => {
        try { return new URL(s.url).hostname; } catch { return null; }
      }).filter(Boolean).slice(0, 3);

      if (topDomains.length) {
        const template = (promptsData.prompts.top3Websites || [{ text: "Your top sites: [TopSites]" }])[0].text;
        const list = topDomains.join(', ');
        slides.push({
          id: 'topSites',
          video: videos[3],
          prompt: template.replace('[TopSites]', list),
          metric: false,
        });
      }

      const visitsPerHour = await safeCallBackground("getVisitsPerHour", { days }) || [];
      let peakHour = visitsPerHour.length ? visitsPerHour.reduce((a, b) => a.totalVisits > b.totalVisits ? a : b) : { hour: 0, totalVisits: 0 };

      slides.push({
        id: 'visitsPerHour',
        video: videos[4],
        prompt: pickPrompt("peakBrowsingTime", {
          Start: `${(peakHour.hour % 12) || 12}${peakHour.hour < 12 ? 'am' : 'pm'}`,
          End: `${((peakHour.hour + 1) % 12) || 12}${(peakHour.hour + 1) < 12 ? 'am' : 'pm'}`,
          Count: peakHour.totalVisits
        }),
      });

      if (visitsPerHour.length) {
        slides.push({
          id: 'visitsPerHourChart',
          video: null,
          prompt: 'Your browsing activity by hour ⏰',
          chart: <TimeOfDayHistogram data={visitsPerHour} />
        });
      }

      const dailyCounts = await safeCallBackground("getDailyVisitCounts", { days }) || [];
      const busiestDay = dailyCounts.sort((a, b) => b.count - a.count)[0];
      if (busiestDay) {
        slides.push({
          id: 'busiestDay',
          video: videos[5],
          prompt: pickPrompt("busiestDay", { Date: busiestDay.date, Count: busiestDay.count })
        });
      }

      const labelCounts = await safeCallBackground("getLabelCounts", { days }) || [];
      const topCategory = labelCounts[0];
      if (topCategory) {
        slides.push({
          id: 'topCategory',
          video: videos[6],
          prompt: pickPrompt("topCategory", { Category: topCategory.categories[0], Count: topCategory.count })
        });
        slides.push({
          id: 'topCategoryRadar',
          video: null,
          prompt: "Here's how your categories stack up 📊",
          chart: <RadarCategoryChart data={labelCounts.map(c => ({ category: c.categories[0], count: c.count }))} />
        });
      }

      slides.push({
        id: 'recapOutro',
        video: videos[7],
        prompt: pickPrompt("recapOutro", { x: timeRangeMap[timeRange] })
      });
      setSlides(slides);
      setNotEnoughData(false);
      setLoading(false);
      setProgress(100);
    };
  
    loadSlides();
  }, [timeRange]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          return prev + Math.random() * 5;
        } else {
          return prev;
        }
      });
    }, 200);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.load();
  }, [index]);

  useEffect(() => {
    if (loading || notEnoughData) return;
  
    const timer = setTimeout(() => {
      setIndex(prev => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 5000);
  
    return () => clearTimeout(timer);
  }, [index, slides.length, loading, notEnoughData]);

  //  LOADING SCREEN
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
  
  if (notEnoughData) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '2rem', boxSizing: 'border-box' }}>
        <h1 style={{ color: '#fff', textAlign: 'center', marginTop: '35vh' }}>Not enough browsing history yet. Your recap will be ready once you’ve explored a bit more!</h1>
    </div>
    );
  }
  

  // 🚀 SLIDESHOW UI after loading
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
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
          <h1 style={{ color: '#fff', textAlign: 'center', marginTop: '35vh' }}>{slides[index]?.prompt}</h1>
        )}
      </div>

      <button onClick={() => setIndex(index + 1)} disabled={index >= slides.length - 1} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', zIndex: 10 }}><FaArrowRight /></button>
      <button onClick={() => setIndex(index - 1)} disabled={index === 0} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', zIndex: 10 }}><FaArrowLeft /></button>
    </div>
  );
};

export default SlideShow;

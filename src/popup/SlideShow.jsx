import React, { useState, useEffect, useRef } from 'react';
import './popup.css';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import promptsData from "./prompts.json";
import RadarCategoryChart from './RadarCategoryChart';
import TimeOfDayHistogram from './TimeOfDayHistogram';


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

  const timeRangeMap = {
    day: "today",
    week: "this week",
    month: "this month",
  };

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

  const shuffledVideos = shuffle([...backgroundVideos]);

  useEffect(() => {
    const loadSlides = async () => {
      setLoading(true);
      const bg = browser.extension.getBackgroundPage();
      const daysMap = { day: 1, week: 7, month: 30 };
      const days = daysMap[timeRange] || 1;

      const slides = [];


      // INTRO TO RECAP
      slides.push({
        id: 'intro',
        video: shuffledVideos[0],
        prompt: pickPrompt("introRecap", { x: timeRangeMap[timeRange] }),
        metric: false,
        metric_type: null
      });

      // INTRO TO TOTAL WEBSITES
      slides.push({
        id: 'totalVisits',
        video: shuffledVideos[1],
        prompt: pickPrompt("introToTotalWebsites", { x: timeRangeMap[timeRange] }),
        metric: false,
        metric_type: null
      });
      
      // UNIQUE WEBSITES VISITED
      const totalUnique = await bg.getUniqueWebsites(days);
      slides.push({
        id: 'totalWebsites',
        video: shuffledVideos[2],
        prompt: `You visited ${totalUnique.toLocaleString()} unique websites ${timeRangeMap[timeRange]}.`,
        metric: true,
        metric_type: "count"
      });


      // HERE I WANT TO ADD A SLIDE FOR TOTAL NUMBER OF SITES 

    //   slides.push({
    //     id: 'totalWebsites',
    //     video: shuffledVideos[7],
    //     prompt:
    //     metric: false,
    //     metric_type: null
    //   });

      // TOP 3 SITES 
      const topSitesRaw = await bg.getMostVisitedSites(days, 10);
      const topDomains = [...new Set(topSitesRaw.map(s => {
        try { return new URL(s.url).hostname; } catch { return null; }
      }).filter(Boolean))].slice(0, 3);

      if (topDomains.length >= 1) {
        const [w1, w2, w3] = topDomains;
        slides.push({
          id: 'topSites',
          video: shuffledVideos[2],
          prompt: pickPrompt("top3Websites", {
            'Website 1': w1 || '—',
            'Website 2': w2 || '',
            'Website 3': w3 || ''
          }),
          metric: false,
          metric_type: null
        });
      }


      // PEAK BROWSING TIME 
      const visitsPerHour = await bg.getVisitsPerHour(days);
const peakHour = visitsPerHour.reduce((a, b) => (a.totalVisits > b.totalVisits ? a : b));

    // Existing slide with prompt
    slides.push({
      id: 'visitsPerHour',
      video: shuffledVideos[4],
      prompt: pickPrompt("peakBrowsingTime", {
        Start: `${(peakHour.hour % 12) || 12}${peakHour.hour < 12 ? 'am' : 'pm'}`,
        End: `${((peakHour.hour + 1) % 12) || 12}${(peakHour.hour + 1) < 12 ? 'am' : 'pm'}`,
        Count: peakHour.totalVisits
      }),
      metric: false,
      metric_type: null
    });

    // New histogram chart slide
    slides.push({
      id: 'visitsPerHourChart',
      video: null,
      prompt: "Your browsing activity by hour ⏰",
      chart: <TimeOfDayHistogram data={visitsPerHour} />,
      metric: false,
      metric_type: null
    });

      // TOP CATEGORY 
      const labelCounts = await bg.getLabelCounts(days);
      const topCategory = labelCounts.sort((a, b) => b.count - a.count)[0];

      // Format all categories for radar chart
      const categoryChartData = labelCounts.map(item => ({
        category: item.categories[0],
        count: item.count
      }));

      if (topCategory) {
        slides.push({
          id: 'topCategory',
          video: shuffledVideos[5],
          prompt: pickPrompt("topCategory", {
            Category: topCategory.categories[0],
            Count: topCategory.count
          }),
          metric: false,
          metric_type: null
        });

        slides.push({
          id: 'topCategoryRadar',
          video: null, // optional background
          prompt: "Here's how your categories stack up 📊",
          chart: <RadarCategoryChart data={categoryChartData} />,
          metric: false,
          metric_type: null
        });
      }


      // BUSIEST DAY 
      const dailyCounts = await bg.getDailyVisitCounts(days);
      const mostVisitedDay = dailyCounts.sort((a, b) => b.count - a.count)[0];
      if (mostVisitedDay) {
        slides.push({
          id: 'busiestDay',
          video: shuffledVideos[6],
          prompt: pickPrompt("busiestDay", {
            Date: mostVisitedDay.date,
            Count: mostVisitedDay.count
          }),
          metric: false,
          metric_type: null
        });
      }

      // TRENDING CATEGORY ON DATE 
      const categoryTrends = await bg.getCategoryTrends(days);
      const topTrend = categoryTrends.sort((a, b) => b.categories[0].count - a.categories[0].count)[0];
      if (topTrend) {
        slides.push({
          id: 'trendingCategory',
          video: shuffledVideos[7],
          prompt: pickPrompt("trendingCategory", {
            Category: topTrend.categories[0].label,
            Date: topTrend.date
          }),
          metric: false,
          metric_type: null
        });
      }

      // MOST COMMON JUMP 
      const transitionPatterns = await bg.getTransitionPatterns(days);
      const topTransition = transitionPatterns.summary.topPattern;
      if (topTransition) {
        slides.push({
          id: 'topTransition',
          video: shuffledVideos[8],
          prompt: pickPrompt("mostCommonJump", {
            From: new URL(topTransition.from).hostname,
            To: new URL(topTransition.to).hostname
          }),
          metric: false,
          metric_type: null
        });
      }

      // FINAL SLIDE: OUTRO
      slides.push({
        id: 'recapOutro',
        video: shuffledVideos[9],
        prompt: pickPrompt("recapOutro", { x: timeRangeMap[timeRange] }),
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
    const timer = setTimeout(() => {
      setIndex(prev => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 5000);
  
    return () => clearTimeout(timer);
  }, [index, slides.length]);

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
        {slides.length > 0 && slides[index].video && (
          <source src={slides[index].video} type="video/mp4" />
        )}
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
  {/* // chart  */}

            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '2rem', boxSizing: 'border-box' }}>
        {slides[index]?.chart ? (
          <>
            <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '1rem' }}>{slides[index]?.prompt}</h1>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100% - 100px)' }}>
              {slides[index].chart}
            </div>
          </>
        ) : (
          <h1 style={{ color: '#fff', textAlign: 'center', marginTop: '35vh' }}>{slides[index]?.prompt}</h1>
        )}
      </div>

  
      {/* Navigation Buttons */}
      <button
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '2rem',
          cursor: 'pointer',
          zIndex: 10
        }}
        onClick={() => setIndex(index + 1)}
        disabled={index >= slides.length - 1}
      >
        <FaArrowRight />
      </button>
  
      <button
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '2rem',
          cursor: 'pointer',
          zIndex: 10
        }}
        onClick={() => setIndex(index - 1)}
        disabled={index === 0}
      >
        <FaArrowLeft />
      </button>
    </div>
  );
};

export default SlideShow;

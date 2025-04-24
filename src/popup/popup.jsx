import React, { useState } from 'react';
import { fetchAndStoreHistory } from '../background/handlers/fetchAndStoreHistory.js';
import HomeView from './HomeView';
import SlideShow from './SlideShow';

const daysMap = { day: 1, week: 7, month: 30 };

const Popup = () => {
  const [view, setView]       = useState('home');
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('day');
  const [topDomains, setTopDomains] = useState([]);

  const onSelectTimeRange = async (range) => {
    setLoading(true);
    await fetchAndStoreHistory(1);
    const days = daysMap[range] || 1;
    const since = Date.now() - days*24*60*60*1000;
    // requires "history" permission in manifest
    const visits = await browser.history.search({ text: '', startTime: since, maxResults: 1000 });
    const counts = {};
    visits.forEach(v => {
      try {
        const d = new URL(v.url).hostname.replace(/^www\./,'');
        counts[d] = (counts[d]||0) + 1;
      } catch{}
    });
    const top = Object.entries(counts)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,3)
      .map(([domain,count])=>({ domain, count }));
    setTopDomains(top);
    setTimeRange(range);
    setLoading(false);
    setView('slideshow');
  };



  if (view === 'home') {
    return (
      <HomeView
        onSelectTimeRange={onSelectTimeRange}
        loading={loading}
        onOpenSettings={() => setView('settings')}
      />
    );
  }
  
  if (view === 'slideshow') {
    return (
      <SlideShow
        setView={setView}
        timeRange={timeRange}
        topDomains={topDomains}
      />
    );
  }
  
  if (view === 'settings') {
    return (
      <div style={{ padding: '20px', color: '#333' }}>
        <h2>Settings (Coming Soon)</h2>
        <button onClick={() => setView('home')}>← Back to Home</button>
      </div>
    );
  }
}
  

export default Popup;
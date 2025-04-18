import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import HomeView from './HomeView';
import SlideShow from './SlideShow';
import { getTopVisitedDomains } from '../sdk/firefoxrecapSDK';

const Popup = () => {
  const [view, setView] = useState('home');
  const [timeRange, setTimeRange] = useState(null);
  const [topDomains, setTopDomains] = useState([]);

  const handleTimeRangeSelect = async (range) => {
    setTimeRange(range);
    const domains = await getTopVisitedDomains(range);
    setTopDomains(domains);
    setView('recap');
  };

  return (
    <div className="container">
      {view === 'home' ? (
        <HomeView onSelectTimeRange={handleTimeRangeSelect} />
      ) : (
        <SlideShow
          setView={setView}
          timeRange={timeRange}
          topDomains={topDomains}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);
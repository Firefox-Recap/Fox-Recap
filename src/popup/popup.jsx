import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import HomeView from './HomeView';
import RecapView from './RecapView';

const Popup = () => {
  const [view, setView] = useState('home');
  const [timeRange, setTimeRange] = useState(null);

  const handleTimeRangeSelect = (range) => {
    // only now we switch to recap, RecapView will fetch GET_RECAP_DATA (and top‐visited domains)
    setTimeRange(range);
    setView('recap');
  };

  return (
    <div className="container">
      {view === 'home' ? (
        <HomeView onSelectTimeRange={handleTimeRangeSelect} />
      ) : (
        <RecapView timeRange={timeRange} onBack={() => setView('home')} />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);
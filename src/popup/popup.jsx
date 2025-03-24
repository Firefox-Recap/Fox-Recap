// src/popup/popup.jsx
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import HomeView from './HomeView';
import SlideShow from './SlideShow';
import promptsData from './prompts.json';

const Popup = () => {
  const [view, setView] = useState('home'); // "home" or "slides"
  const [timeRange, setTimeRange] = useState(null);

  const handleTimeRangeSelect = (range) => {
    setTimeRange(range);
    setView('slides');
  };

  return (
    <div className="container">
      {view === 'home' ? (
        <HomeView onSelectTimeRange={handleTimeRangeSelect} />
      ) : (
        <SlideShow 
          timeRange={timeRange} 
          setView={setView} 
          prompts={promptsData.prompts}/>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);

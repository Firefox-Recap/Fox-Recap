import React, { useState } from 'react';
import HomeView from './HomeView';
import SlideShow from './SlideShow';

const Popup = () => {
  const [view, setView] = useState('home');
  const [timeRange, setTimeRange] = useState('day');

  const onSelectTimeRange = (range) => {
    const url = browser.runtime.getURL(`recap.html?range=${range}`);
    browser.tabs.create({ url });
  };

  return view === 'home'
    ? <HomeView onSelectTimeRange={onSelectTimeRange} />
    : <SlideShow timeRange={timeRange} setView={setView} />;
};

export default Popup;

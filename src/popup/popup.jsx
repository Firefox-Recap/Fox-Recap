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

  const handleOpenSettings = () => {
    browser.runtime.openOptionsPage();
  };

  return view === 'home'
    ? <HomeView onSelectTimeRange={onSelectTimeRange} onOpenSettings={handleOpenSettings} />
    : <SlideShow timeRange={timeRange} setView={setView} />;
};

export default Popup;

import React, { useState } from 'react';
import HomeView from './HomeView';
import SlideShow from './SlideShow';

const Popup = () => {
  const [view, setView] = useState('home');
  const [timeRange, setTimeRange] = useState('day');

  const onSelectTimeRange = async (range) => {
    const daysMap = { day: 1, week: 7, month: 30 };
    const days = daysMap[range] || 1;

    // 🔥 Step 1: Tell background to fetch and store history
    await browser.runtime.sendMessage({
      action: "fetchAndStoreHistory",
      days,
    });

    // 🔥 Step 2: Open recap tab
    const url = browser.runtime.getURL(`recap.html?range=${range}`);
    browser.tabs.create({ url });
  };

  return view === 'home'
    ? <HomeView onSelectTimeRange={onSelectTimeRange} />
    : <SlideShow timeRange={timeRange} setView={setView} />;
};

export default Popup;

// import React, { useState, useCallback } from 'react';
// import { fetchAndStoreHistory } from '../background/handlers/fetchAndStoreHistory.js';
// import HomeView from './HomeView';
// import SlideShow from './SlideShow';

// const daysMap = { day: 1, week: 7, month: 30 };

// const Popup = () => {
//   const [view, setView] = useState('home');
//   const [loading, setLoading] = useState(false);
//   const [timeRange, setTimeRange] = useState('day');

//   const onSelectTimeRange = useCallback(async (range) => {
//     const url = browser.runtime.getURL(`recap.html?range=${range}`);
//     browser.tabs.create({ url });
//     // setLoading(true);
//     // const days = daysMap[range] || 1;
//     // await fetchAndStoreHistory(days);
//     // setTimeRange(range);
//     // setLoading(false);
//     // setView('slideshow');
//   }, []);

//   switch (view) {
//     case 'home':
//       return (
//         <HomeView
//           onSelectTimeRange={onSelectTimeRange}
//           loading={loading}
//           onOpenSettings={() => setView('settings')}
//         />
//       );

//     case 'slideshow':
//       return (
//         <SlideShow
//           timeRange={timeRange}
//           setView={setView}
//         />
//       );

//     case 'settings':
//       return (
//         <div style={{ padding: '20px', color: '#333' }}>
//           <h2>Settings (Coming Soon)</h2>
//           <button onClick={() => setView('home')}>← Back to Home</button>
//         </div>
//       );

//     default:
//       return null;
//   }
// };

// export default Popup;
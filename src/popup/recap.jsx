import React from 'react';
import { createRoot } from 'react-dom/client';
import SlideShow from './SlideShow'; // you already have this

// Read time range from URL query parameter (day/week/month)
const params = new URLSearchParams(window.location.search);
const timeRange = params.get('range') || 'day'; // default fallback

console.log("Recap loaded");

createRoot(document.getElementById('root')).render(
  <SlideShow timeRange={timeRange} setView={() => {}} />
);

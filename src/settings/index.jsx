import React from 'react';
import { createRoot } from 'react-dom/client';
import Settings from './Settings.jsx';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Settings />);
} else {
  console.error('Could not find #root container for settings');
}
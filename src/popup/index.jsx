import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './popup.jsx';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} else {
  console.error('Could not find #root container');
}
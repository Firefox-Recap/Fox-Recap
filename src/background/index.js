/**
 * index.js
 * -------------------------------
 * Entry point for background scripts in the Histofy Firefox Extension.
 * Initializes and triggers the history collection process upon extension startup.
 */

import './background.js';
import { collectHistory } from './historyCollector.js';

// Kick off initial history collection
collectHistory().then(() => {
  console.log('Initial History Collection started.');
});

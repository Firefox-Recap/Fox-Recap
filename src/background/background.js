import { initDB } from './initdb.js';
import handlers       from './handlers/index.js';

(async function init() {
  try {
    await initDB();
    console.log('[background] Database initialized');
  } catch (err) {
    console.error('[background] Database initialization failed', err);
  }
})

Object.assign(window, handlers);
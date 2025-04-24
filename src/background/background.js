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


// (async () => {
//   try {
//     // this has to be called otherwise we dont have a history database to look at start with 1 day then 7 then 30 this can be managed on frontend i think
      // moved to popup.jsx
//     await fetchAndStoreHistory(1);
//     console.log('fetchAndStoreHistory completed');
//   } catch (err) {
//     console.error('fetchAndStoreHistory failed', err);
//   }
// })();

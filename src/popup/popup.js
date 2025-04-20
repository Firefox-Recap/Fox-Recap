async function callBg(fnName, ...args) {
    const bg = await browser.extension.getBackgroundPage();
    if (typeof bg[fnName] !== 'function') {
      throw new Error(fnName + ' is not available on background');
    }
    return await bg[fnName](...args);
  }
  
  function render(obj) {
    document.getElementById('output').textContent =
      JSON.stringify(obj, null, 2);
  }

function getDays() {
  const n = parseInt(document.getElementById('days').value, 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

document.getElementById('btnVisited').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getMostVisitedSites', days, 5);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

document.getElementById('btnLabels').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getTotalCategoryCount', days);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

document.getElementById('btnCO').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getCOCounts', days);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

document.getElementById('btnVisitsPerHour').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getVisitsPerHour', days);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

document.getElementById('btnDaily').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getDailyVisitCounts', days);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

document.getElementById('btnCategoryTrends').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getCategoryTrends', days);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

document.getElementById('btnTransitionPatterns').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getTransitionPatterns', days);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

document.getElementById('btnTimeSpent').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getTimeSpentPerSite', days, 5);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

// Recency Frequency
document.getElementById('btnRecencyFreq').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getRecencyFrequency', days);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});

// Typed URL Ratio
document.getElementById('btnTypedRatio').addEventListener('click', async () => {
  const days = getDays();
  try {
    const data = await callBg('getTypedUrlRatio', days);
    render(data);
  } catch (e) {
    render({ error: e.message });
  }
});
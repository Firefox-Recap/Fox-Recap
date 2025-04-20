// …move all of popup.html’s inline script here…

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
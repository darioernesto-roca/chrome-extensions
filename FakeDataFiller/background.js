// Clicking the toolbar icon (or pressing Alt+Shift+F) injects filler.js into
// the current tab. The activeTab permission grants access to that tab only at
// that moment, so the extension never has standing access to any website.

async function showBadge(tabId, text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color });
    await chrome.action.setBadgeText({ tabId, text });
    setTimeout(() => chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {}), 2500);
  } catch {
    // Tab closed.
  }
}

async function inject(tabId, allFrames) {
  return chrome.scripting.executeScript({
    target: { tabId, allFrames },
    files: ['filler.js']
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id === undefined) return;
  let results;
  try {
    results = await inject(tab.id, true);
  } catch {
    try {
      // Some frames (e.g. cross-origin payment iframes) can't be accessed;
      // fall back to the main page only.
      results = await inject(tab.id, false);
    } catch (err) {
      // chrome:// pages, the Chrome Web Store and similar can't be scripted.
      console.warn('Fake Data Filler:', err.message);
      showBadge(tab.id, '×', '#D93025');
      return;
    }
  }
  const filled = results.reduce((sum, r) => sum + (Number(r.result) || 0), 0);
  showBadge(tab.id, String(filled), filled > 0 ? '#1E8E3E' : '#80868B');
});

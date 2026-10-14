// Keeps an error count and recent error list per tab, and shows the count
// on the toolbar badge. State lives in chrome.storage.session so it survives
// the service worker being stopped, and is cleared when the browser closes.

const MAX_STORED_ERRORS = 50;
const BADGE_COLOR = '#D93025';

const storageKey = (tabId) => `tab:${tabId}`;
const emptyState = () => ({ count: 0, errors: [] });

// Messages for the same tab are processed one at a time, so two batches
// arriving together can't overwrite each other's count.
const queues = new Map();
function runForTab(tabId, task) {
  const next = (queues.get(tabId) || Promise.resolve()).then(task).catch((err) => {
    console.warn('Console Error Badge:', err);
  });
  queues.set(tabId, next);
  return next;
}

async function getState(tabId) {
  const key = storageKey(tabId);
  const stored = await chrome.storage.session.get(key);
  return stored[key] || emptyState();
}

async function setState(tabId, state) {
  await chrome.storage.session.set({ [storageKey(tabId)]: state });
  await updateBadge(tabId, state.count);
}

async function updateBadge(tabId, count) {
  const text = count === 0 ? '' : count > 99 ? '99+' : String(count);
  try {
    await chrome.action.setBadgeText({ tabId, text });
    await chrome.action.setTitle({
      tabId,
      title: count === 0 ? 'No JavaScript errors on this page' : `${count} JavaScript error${count === 1 ? '' : 's'} on this page`
    });
  } catch {
    // The tab was closed in the meantime.
  }
}

chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
if (chrome.action.setBadgeTextColor) {
  chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
}

chrome.runtime.onMessage.addListener((message, sender) => {
  // Messages from the popup carry the tab id explicitly.
  if (message && message.type === 'clear' && Number.isInteger(message.tabId)) {
    runForTab(message.tabId, () => setState(message.tabId, emptyState()));
    return;
  }

  // Everything else must come from a page's top frame.
  const tabId = sender.tab && sender.tab.id;
  if (!Number.isInteger(tabId) || tabId < 0 || sender.frameId !== 0) return;

  if (message.type === 'reset') {
    runForTab(tabId, () => setState(tabId, emptyState()));
  } else if (message.type === 'errors' && Array.isArray(message.errors)) {
    runForTab(tabId, async () => {
      const state = await getState(tabId);
      state.count += message.errors.length;
      state.errors = state.errors.concat(message.errors).slice(-MAX_STORED_ERRORS);
      await setState(tabId, state);
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  queues.delete(tabId);
  chrome.storage.session.remove(storageKey(tabId));
});

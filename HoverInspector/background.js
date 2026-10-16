// Clicking the toolbar icon turns the inspector on or off on every tab.
// The badge shows "ON" while it is active.
importScripts('settings.js');

async function refreshBadge() {
  const { enabled, modifier } = await chrome.storage.local.get(HOVER_INSPECTOR_DEFAULTS);
  const key = HOVER_INSPECTOR_KEY_NAMES[modifier] || modifier;
  await chrome.action.setBadgeBackgroundColor({ color: '#1A73E8' });
  if (chrome.action.setBadgeTextColor) await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  await chrome.action.setBadgeText({ text: enabled ? 'ON' : '' });
  await chrome.action.setTitle({
    title: enabled
      ? `Hover Inspector is on: hold ${key} and hover an element. Click to turn off.`
      : 'Hover Inspector is off. Click to turn on.'
  });
}

chrome.action.onClicked.addListener(async () => {
  const { enabled } = await chrome.storage.local.get(HOVER_INSPECTOR_DEFAULTS);
  await chrome.storage.local.set({ enabled: !enabled });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') refreshBadge();
});

chrome.runtime.onInstalled.addListener(refreshBadge);
chrome.runtime.onStartup.addListener(refreshBadge);
refreshBadge();

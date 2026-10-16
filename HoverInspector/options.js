const enabledBox = document.getElementById('enabled');
const savedNote = document.getElementById('saved');

function flashSaved() {
  savedNote.style.visibility = 'visible';
  setTimeout(() => { savedNote.style.visibility = 'hidden'; }, 1200);
}

chrome.storage.local.get(HOVER_INSPECTOR_DEFAULTS).then(({ enabled, modifier }) => {
  enabledBox.checked = enabled;
  const radio = document.querySelector(`input[name="modifier"][value="${modifier}"]`);
  if (radio) radio.checked = true;
});

enabledBox.addEventListener('change', async () => {
  await chrome.storage.local.set({ enabled: enabledBox.checked });
  flashSaved();
});

for (const radio of document.querySelectorAll('input[name="modifier"]')) {
  radio.addEventListener('change', async () => {
    await chrome.storage.local.set({ modifier: radio.value });
    flashSaved();
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.enabled) enabledBox.checked = changes.enabled.newValue;
});

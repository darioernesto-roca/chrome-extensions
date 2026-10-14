const summaryEl = document.getElementById('summary');
const emptyEl = document.getElementById('empty');
const listEl = document.getElementById('list');
const noteEl = document.getElementById('note');
const clearBtn = document.getElementById('clear');

let tabId = null;

const fileName = (url) => {
  if (!url) return '';
  try {
    const { pathname, host } = new URL(url);
    return pathname.split('/').filter(Boolean).pop() || host;
  } catch {
    return url;
  }
};

const timeOf = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Error messages come from web pages, so they are only ever inserted as text.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render(state) {
  const { count, errors } = state;
  summaryEl.textContent = count === 0 ? 'This page has not thrown any errors.' : `${count} error${count === 1 ? '' : 's'} since the page loaded`;
  emptyEl.hidden = count !== 0;
  clearBtn.disabled = count === 0;
  noteEl.hidden = count <= errors.length;

  listEl.replaceChildren();
  for (const error of [...errors].reverse()) {
    const item = el('li', error.type === 'unhandledrejection' ? 'rejection' : '');
    item.append(el('div', 'message', error.message));

    const meta = el('div', 'meta');
    const location = error.source ? `${fileName(error.source)}:${error.line}:${error.column}` : 'Promise';
    const source = el('span', 'source', location);
    if (error.source) source.title = error.source;
    meta.append(source, el('span', '', timeOf(error.time)));
    item.append(meta);

    if (error.stack) {
      const details = el('details');
      details.append(el('summary', '', 'Stack trace'), el('pre', '', error.stack));
      item.append(details);
    }
    listEl.append(item);
  }
}

async function load() {
  const key = `tab:${tabId}`;
  const stored = await chrome.storage.session.get(key);
  render(stored[key] || { count: 0, errors: [] });
}

clearBtn.addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'clear', tabId });
  } catch {
    // No response is expected; the list refreshes through storage.onChanged.
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'session' && changes[`tab:${tabId}`]) load();
});

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  tabId = tab.id;
  load();
})();

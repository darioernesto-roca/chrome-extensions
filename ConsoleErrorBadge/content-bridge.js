// Runs in the extension's isolated world. Collects errors reported by
// content-main.js and forwards them to the service worker in small batches,
// so a page throwing in a loop doesn't flood the extension with messages.
(() => {
  const EVENT = 'console-error-badge:error';
  const FLUSH_DELAY_MS = 250;
  const MAX_TEXT = 2000;

  let queue = [];
  let timer = null;

  const send = (message) => {
    try {
      chrome.runtime.sendMessage(message).catch(() => {});
    } catch {
      // The extension was reloaded or removed; nothing to do.
    }
  };

  const flush = () => {
    timer = null;
    const errors = queue;
    queue = [];
    if (errors.length) send({ type: 'errors', errors });
  };

  // A new document has started: reset this tab's count.
  send({ type: 'reset' });

  document.addEventListener(EVENT, (event) => {
    let entry;
    try {
      entry = JSON.parse(event.detail);
    } catch {
      return;
    }
    queue.push({
      type: entry.type === 'unhandledrejection' ? 'unhandledrejection' : 'error',
      message: String(entry.message || 'Unknown error').slice(0, MAX_TEXT),
      source: String(entry.source || '').slice(0, MAX_TEXT),
      line: Number(entry.line) || 0,
      column: Number(entry.column) || 0,
      stack: String(entry.stack || '').slice(0, MAX_TEXT),
      time: Date.now()
    });
    if (!timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
  });
})();

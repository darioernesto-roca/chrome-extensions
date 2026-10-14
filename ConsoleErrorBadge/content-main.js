// Runs in the page's own JavaScript world so it can see the page's errors.
// It has no access to extension APIs, so it hands each error to
// content-bridge.js through a DOM event carrying a JSON string.
(() => {
  const EVENT = 'console-error-badge:error';

  const report = (entry) => {
    try {
      document.dispatchEvent(new CustomEvent(EVENT, { detail: JSON.stringify(entry) }));
    } catch {
      // Never let the reporter itself throw on the page.
    }
  };

  const describe = (value) => {
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  // Uncaught exceptions. Failed image/script loads fire a plain Event,
  // not an ErrorEvent, so they are ignored here.
  window.addEventListener('error', (event) => {
    if (!(event instanceof ErrorEvent)) return;
    report({
      type: 'error',
      message: event.message || describe(event.error),
      source: event.filename || '',
      line: event.lineno || 0,
      column: event.colno || 0,
      stack: event.error && event.error.stack ? String(event.error.stack) : ''
    });
  });

  // Promises rejected with no .catch().
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    report({
      type: 'unhandledrejection',
      message: `Uncaught (in promise) ${describe(reason)}`,
      source: '',
      line: 0,
      column: 0,
      stack: reason && reason.stack ? String(reason.stack) : ''
    });
  });
})();

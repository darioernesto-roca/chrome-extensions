# Console Error Badge

Shows how many JavaScript errors the current page has thrown as a red badge on the toolbar icon, so you notice errors without opening DevTools.

## Features

- **Error count on the toolbar icon.** The count is per tab and resets every time the page loads.
- **Error list in the popup.** Click the icon to see each error's message, file, line and column, the time it happened, and its stack trace.
- **Clear button.** Resets the count for the current tab without reloading.

## What it counts

| Counted | Not counted |
|---|---|
| Uncaught exceptions (`throw`, `ReferenceError`, `TypeError`, …) | `console.error()` calls |
| Unhandled promise rejections | Failed network requests and 404s |
| | Failed image, script or stylesheet loads |
| | Errors inside iframes |

Errors from scripts on another domain loaded without CORS headers show only as `Script error.`. The browser hides their details from every page script, including this extension.

## Installation

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right corner).
3. Click **Load unpacked** and select the `ConsoleErrorBadge` folder.
4. Pin the extension (puzzle icon → pin) so the badge is always visible.

Pages that were already open need a reload before they are tracked.

## How it works

| File | Role |
|---|---|
| `content-main.js` | Runs in the page's own JavaScript context and listens for `error` and `unhandledrejection` events. |
| `content-bridge.js` | Runs in the extension's isolated context and forwards errors to the service worker in batches every 250 ms. |
| `background.js` | Keeps the count and the last 50 errors per tab in `chrome.storage.session`, and updates the badge. |
| `popup.html`, `popup.js`, `popup.css` | The error list shown when you click the icon. |

## Permissions and privacy

- **Content scripts on all sites** (`<all_urls>`): needed to see errors on any page you open. To track only your development sites, change both `matches` entries in `manifest.json`, for example:
  ```json
  "matches": ["http://localhost/*", "http://127.0.0.1/*", "https://*.staging.example.com/*"]
  ```
- **`storage`**: keeps the counts in session storage, which is cleared when Chrome closes.

The extension only reads error messages. It doesn't read page content, and nothing is sent outside your browser.

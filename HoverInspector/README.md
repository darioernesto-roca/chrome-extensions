# Hover Inspector

Hold **Ctrl** and move the mouse over any element to see a DevTools-style box with its details, without opening DevTools.

## What the box shows

| For | Details |
|---|---|
| Every element | Tag, `#id` and first three `.classes`, and its size in pixels (width × height) |
| Text | Text color (hex with swatch), font size and family, font weight and line height |
| Text contrast | Contrast ratio against the background, with ✓ when it passes WCAG AA (4.5:1, or 3:1 for large text) and ✗ when it fails |
| Backgrounds | Background color and background image URL, when set |
| Images | `alt` text (flagged in red when **missing**, or noted when empty), source URL, and natural size |
| Links | `href` (full URL), `target` (or "None (same tab)"), and `rel`. Also shown when hovering text inside a link. |

The element is highlighted in blue while the box is visible, the same way DevTools does it.

## Usage

- **Hold Ctrl and hover** to inspect. Release Ctrl to hide the box.
- **Click the toolbar icon** to turn the inspector on or off on all tabs. The icon shows a blue **ON** badge while it's on.
- **Change the key** by right-clicking the toolbar icon → **Options**, where you can pick Ctrl, Shift, Alt, or Cmd/Windows.

Tips:
- Hold the key first and then move the mouse, or point at an element and then press the key; both work.
- Pressing Ctrl and quickly releasing it (as in Ctrl+C) doesn't flash the box.
- Clicking a link while holding Ctrl still opens it in a new tab, as usual in Chrome.

## Installation

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right corner).
3. Click **Load unpacked** and select the `HoverInspector` folder.
4. Reload any tabs that were already open.

## Notes

- **Contrast** is calculated against the background colors of the element and its parents. When a background image is involved, the ratio is shown with **≈** because the image may change the real contrast.
- **Iframes**: elements inside iframes are inspected by the copy of the script running in that frame.
- The box is drawn inside a closed shadow root in the browser's top layer, so page styles can't change it and it appears above modals.
- It doesn't run on Chrome pages (`chrome://`) or the Chrome Web Store.

## Permissions and privacy

- **Content script on all sites** (`<all_urls>`): needed so the inspector works on any page you open. It does nothing until you hold the key.
- **`storage`**: remembers whether the inspector is on and which key you chose.

Nothing is collected or sent anywhere.

## Files

| File | Role |
|---|---|
| `content.js` | Reads the hovered element and draws the box and highlight. |
| `background.js` | Turns the inspector on or off from the toolbar icon and updates the badge. |
| `options.html`, `options.js` | Options page for choosing the key. |
| `settings.js` | Default settings shared by the service worker and options page. |

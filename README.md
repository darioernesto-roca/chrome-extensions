# chrome-extensions

A collection of small, dependency-free extensions and themes for Chrome and Microsoft Edge that I build for my own use, mostly to make web development and everyday browsing easier.

Each extension lives in its own folder with its own `manifest.json` and README. There is no build step: every folder can be loaded into Chrome or Edge as it is.

## Extensions

| Name | Type | What it does | Permissions |
|---|---|---|---|
| [ActiveTabTheme](ActiveTabTheme/) | Theme | Dark themes for Chrome and Edge that make the active tab easy to spot, in seven color variants so each browser can have its own color. | None |
| [ConsoleErrorBadge](ConsoleErrorBadge/) | Developer tool | Shows how many JavaScript errors the current page has thrown on the toolbar icon, with a popup listing each error and its stack trace. | `storage`, content scripts on all sites |
| [FakeDataFiller](FakeDataFiller/) | Developer tool | Fills forms with realistic fake names, emails, addresses and test card details with one click or **Alt+Shift+F**. | `activeTab`, `scripting` |
| [HoverInspector](HoverInspector/) | Developer tool | Hold **Ctrl** and hover any element to see a DevTools-style box with its tag, size, color, font, contrast, image alt and source, and link href and target. | `storage`, content scripts on all sites |

## Repository structure

```
chrome-extensions/
├── ActiveTabTheme/       Dark themes with a highlighted active tab
│   └── variants/         Amber, Cyan, Teal, Magenta, Purple and Sage (Blue is the main folder)
├── ConsoleErrorBadge/    JavaScript error counter on the toolbar icon
├── FakeDataFiller/       One-click form filler for testing
├── HoverInspector/       Element details on hover without DevTools
├── .gitignore
└── README.md
```

## Installing an extension

1. Clone this repository:
   ```bash
   git clone https://github.com/darioernesto-roca/chrome-extensions.git
   ```
2. Open the extensions page and turn on **Developer mode**:
   - **Chrome:** `chrome://extensions` (toggle in the top-right corner)
   - **Edge:** `edge://extensions` (toggle in the left sidebar)
3. Click **Load unpacked** and select the folder of the extension you want, for example `FakeDataFiller`.

Repeat step 3 for each extension you want. To update after pulling changes, click the reload icon on the extension in the extensions page.

Themes work a little differently: they don't appear in the extensions list, and you update or switch one by loading its folder again with **Load unpacked**. The active theme is shown in **Settings → Appearance**.

### Using Chrome and Edge side by side

Load a different ActiveTabTheme variant in each browser so you can tell them apart at a glance, for example **Blue in Chrome** and **Amber in Edge**. A browser uses only one theme at a time. See the [ActiveTabTheme README](ActiveTabTheme/) for all variants and suggested pairs.

## Quick reference

| Extension | How to use it |
|---|---|
| ActiveTabTheme | Always on once loaded |
| ConsoleErrorBadge | Watch the red count on its icon; click the icon for the error list |
| FakeDataFiller | Click its icon or press **Alt+Shift+F** on a page with a form |
| HoverInspector | Click its icon to turn it on (blue **ON** badge), then hold **Ctrl** and hover an element |

## Guidelines for this repo

- **Manifest V3** for every extension.
- **Plain JavaScript, HTML and CSS.** No frameworks, bundlers or npm dependencies, so the code you read is the code that runs.
- **Minimal permissions.** Each extension asks only for what it needs and explains why in its README. Prefer `activeTab` over permanent access to websites.
- **No data leaves the browser.** No analytics, no remote requests.
- **No secrets in the repo.** Private keys (`*.pem`), packed builds (`*.crx`) and Chrome-generated cache files (`*.pak`) are excluded by `.gitignore`.

## Adding a new extension

1. Create a folder with a `PascalCase` name, such as `MyExtension`.
2. Add a `manifest.json` with `"manifest_version": 3`, plus the extension's files and icons (16, 32, 48 and 128 px).
3. Add a `README.md` covering what it does, how to use it, and why it needs each permission.
4. Add a row to the **Extensions** table above.

## Compatibility

Built for Google Chrome and Microsoft Edge on Windows. Because both browsers are based on Chromium, every extension and theme here loads the same way in each. They should also work in other Chromium-based browsers such as Brave.

Themes don't apply to Incognito (Chrome) or InPrivate (Edge) windows, which always use the browser's own dark look.

## License

MIT

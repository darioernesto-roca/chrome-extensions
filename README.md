# chrome-extensions

A collection of small, dependency-free Chrome extensions and themes I build for my own use, mostly to make web development and everyday browsing easier.

Each extension lives in its own folder with its own `manifest.json` and README. There is no build step: every folder can be loaded into Chrome as it is.

## Extensions

| Name | Type | What it does | Permissions |
|---|---|---|---|
| [ActiveTabTheme](ActiveTabTheme/) | Theme | Dark theme that makes the active tab easy to spot with a bright blue color and dimmed inactive tabs. | None |
| [ConsoleErrorBadge](ConsoleErrorBadge/) | Developer tool | Shows how many JavaScript errors the current page has thrown on the toolbar icon, with a popup listing each error and its stack trace. | `storage`, content scripts on all sites |
| [FakeDataFiller](FakeDataFiller/) | Developer tool | Fills forms with realistic fake names, emails, addresses and test card details with one click or **Alt+Shift+F**. | `activeTab`, `scripting` |
| [HoverInspector](HoverInspector/) | Developer tool | Hold **Ctrl** and hover any element to see a DevTools-style box with its tag, size, color, font, contrast, image alt and source, and link href and target. | `storage`, content scripts on all sites |

## Repository structure

```
chrome-extensions/
├── ActiveTabTheme/       Dark theme with a highlighted active tab
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
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the folder of the extension you want, for example `FakeDataFiller`.

Repeat step 4 for each extension you want. To update after pulling changes, click the reload icon on the extension in `chrome://extensions`.

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

Built and tested in Google Chrome on Windows. The extensions should also work in other Chromium-based browsers such as Edge and Brave.

## License

MIT

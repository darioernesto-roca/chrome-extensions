# ActiveTabTheme

A dark Chrome theme that makes the **active tab easy to spot**.

Chrome's default dark mode gives the active tab only a subtle change in shade compared with inactive tabs, so it can be hard to tell which one you are on. This theme keeps the browser dark and gives the active tab a strong blue color with white text, while inactive tabs stay dark grey with dimmed titles.

## What it looks like

| Element | Color |
|---|---|
| Tab strip (frame) | Near-black `rgb(20, 20, 20)` |
| Inactive tabs | Dark grey `rgb(35, 35, 35)` with dimmed grey text |
| **Active tab and toolbar** | **Blue `rgb(0, 95, 160)` with white text** |
| Address bar | Dark `rgb(25, 25, 25)` with light text |
| New Tab page | Dark `rgb(25, 25, 25)` |

The difference in both color and text brightness lets you find the active tab at a glance.

## Installation

1. Download or clone this repository:
   ```bash
   git clone https://github.com/<your-username>/ActiveTabTheme.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `ActiveTabTheme` folder.

The theme applies immediately.

## Customizing the active tab color

The active tab color is set by the `toolbar` value in `manifest.json`. Change it to any RGB value you like:

```json
"toolbar": [0, 95, 160]
```

Some alternatives:

| Color | Value |
|---|---|
| Blue (default) | `[0, 95, 160]` |
| Teal | `[0, 130, 110]` |
| Orange | `[200, 90, 0]` |
| Purple | `[110, 60, 170]` |
| Red | `[170, 40, 40]` |

After editing, go to `chrome://extensions` and click the reload icon on the theme.

Tip: keep `tab_background_text` dimmed (for example `[150, 150, 150]`). The contrast between a bright active title and faded inactive titles helps as much as the color itself.

## Removing the theme

Go to **Settings → Appearance** and click **Reset to default**.

## Compatibility

- Built for Manifest V3.
- Works in Chrome and other Chromium-based browsers that support themes, such as Edge and Brave.
- The theme contains only color values: no code, no permissions, and no data collection.

## License

MIT

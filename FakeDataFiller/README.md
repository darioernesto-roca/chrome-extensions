# Fake Data Filler

Fills the forms on the current page with realistic fake data, which saves time when testing sign-up, checkout and contact flows.

## Usage

Click the toolbar icon or press **Alt+Shift+F**. Every visible field on the page is filled with data for one consistent fake person, and a message in the corner shows the name and password used. The toolbar icon briefly shows how many fields were filled.

To change the shortcut, go to `chrome://extensions/shortcuts`.

## What it fills

| Field | Example |
|---|---|
| First, last and full name | Maria Lopez |
| Email | maria.lopez.3455@example.com |
| Username | marialopez3455 |
| Password (and confirmation) | `Passw0rd!Test` (always the same, so you can log in later) |
| Phone | 512-555-0196 |
| Address, apartment, city, state, ZIP, country | 6665 Elm Street, Apt 30, Austin, Texas, 78701, United States |
| Company and job title | Globex Inc, Software Engineer |
| Date of birth and age | 1978-08-12, 48 |
| Card number, expiry, CVC, name on card | 4242 4242 4242 4242, 12/29, 123 |
| Website | https://example.com |
| Text areas | Lorem ipsum text |
| Dropdowns | Matching option for state, country and card expiry; otherwise a random option |
| Radio buttons | A random option in each group that has none selected |
| Checkboxes | Only required ones and terms or consent boxes; newsletter opt-ins are left alone |

The fake data is safe to use: `example.com` is a domain reserved for testing, `555-01xx` phone numbers are reserved for fictional use, and `4242 4242 4242 4242` is Stripe's public test card, which can't be charged.

## What it skips

- Hidden fields (often honeypots that flag bots), and disabled or read-only fields
- Search, coupon, promo code, CAPTCHA and one-time code fields
- File, color and range inputs
- Cross-origin iframes, such as hosted payment fields from Stripe or Braintree

## How fields are detected

1. The `autocomplete` attribute, such as `given-name`, `email` or `cc-number`, when the site sets it.
2. The input type, such as `email`, `tel`, `password` or `date`.
3. Keywords in the field's name, id, placeholder, `aria-label` and label text. English and common Spanish keywords are recognized (for example `nombre`, `apellido`, `ciudad`, `telefono`).

Values are set with the native value setter and fire `input` and `change` events, so React, Vue and Angular forms pick them up.

## Installation

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right corner).
3. Click **Load unpacked** and select the `FakeDataFiller` folder.

## Permissions and privacy

- **`activeTab`**: gives access to the current tab only at the moment you click the icon or press the shortcut. The extension has no standing access to any website.
- **`scripting`**: injects the filler script into that tab.

No data is stored or sent anywhere. Chrome pages (`chrome://`) and the Chrome Web Store can't be filled; the icon shows a red **×** there.

## Customizing

Edit the lists at the top of `filler.js` (`FIRST_NAMES`, `PLACES`, `COMPANIES`, …) or the `PASSWORD` constant, then click the reload icon on the extension in `chrome://extensions`.

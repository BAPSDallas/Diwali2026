# Diwali 2026 Calendar

Mobile-first BAPS Dallas event selection page. The Diwali & Annakut celebration is always included. Kids Diwali and Chopda Pujan are optional but selected by default. Chopda Pujan offers two mutually exclusive sessions, labelled only by time (4 PM – 6 PM and 6 PM – 8 PM, the latter by default), in one row. A single calendar button adapts to the choices.

## Site and publishing

Repository: https://github.com/BAPSDallas/Diwali2026

QR destination: https://bapsdallas.github.io/Diwali2026/add-calendar.html

GitHub Pages should publish from `main`, folder `/ (root)` using **Settings → Pages → Deploy from a branch**. `.nojekyll` keeps deployment static. No build system, framework, server, or external JavaScript dependencies are needed.

GitHub Pages is configured to publish main from the root folder. The site and QR destination use the URL above.

## Events

All dates are in 2026 and times are America/Chicago. Event dates are retained from the supplied handoff. Times and selections follow the updated user request.

| Event | Date | Time | Included |
| --- | --- | --- | --- |
| Diwali & Annakut (Nutan Varsh), Dallas TX | November 10 | 12 PM–8:30 PM | Always |
| Kids Diwali Celebration (KDC), Dallas TX | October 31 | 10 AM–5 PM | Optional, selected by default |
| Sharda (Chopda) Pujan – Chopda Pujan 1, Dallas TX | November 8 | 5–6 PM, followed by Mahaprasad | Optional |
| Sharda (Chopda) Pujan – Chopda Pujan 2, Dallas TX | November 8 | 6:30–7:30 PM, followed by Mahaprasad | Optional, selected by default |

The Frisco Diwali & Annakut (November 14) was removed on 2026-09-22. The file name `Diwali_Events_Dallas_Frisco_2026.ics` is kept so existing links keep working. Internally the two Chopda sessions keep the ids `morning` and `evening` so their UIDs carry over and already-imported copies update in place (`SEQUENCE` is 2).

Every event includes its full address, a description containing only `https://www.baps.org/dallas`, and reminders one week and one day beforehand.

## Two ways to add events

iPhone and desktop get a single `.ics` file built in the browser and imported in one step.

Android gets a list of per-event Google Calendar links instead, because Google Calendar's Android app has no `.ics` import — a downloaded file simply sits in Downloads. Each link opens Google Calendar prefilled so the visitor taps Save. Google's template URL carries one event per link, so this is deliberately a list rather than a single button.

iPhones and iPads see a single **Add to Apple Calendar** button; Android sees **Add to Google Calendar**. Where the device cannot be identified — desktop, in-app browsers — both are shown, since hiding the wrong one there would leave someone with no way to add anything. iPadOS reports itself as a Mac, so iPad detection combines the platform string with `maxTouchPoints`.

Every displayed title carries its city, e.g. `Diwali & Annakut · Dallas`, on the cards and in the Google Calendar list.

Dallas events: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038. This matches the address on the official [BAPS Dallas site](https://www.baps.org/Dallas).

## Editing

- `calendar.js` is the source of truth for event data and calendar generation.
- `page.js` renders cards and handles selection and download.
- `styles.css` supplies the responsive layout, artwork framing, and photo placeholders.
- `assets/diwali-logo.png` and `assets/festival-background.png` preserve the supplied originals. `assets/diwali-logo-transparent.png` is the extracted transparent logo used over the glass-style page.
- Replace the named PNGs in `assets/events/` to change photos on both pages without code edits. See [IMAGES.md](IMAGES.md) for filenames and publishing instructions.
- `index.html` redirects the site root to `add-calendar.html`.
- `PROJECT_SUMMARY.md` records the original handoff and has superseded event information. This README and calendar.js describe the current requirements.
- `.claude/skills/save-the-date-site/` is a reusable skill capturing how this site is built — the workflow, the layout recipes, the ICS rules, and the lessons learned. Read it before making structural changes, and add to `references/lessons-learned.md` when you learn something new. It is committed deliberately so anyone working on this repo picks up the same conventions.

## Shareable artefacts

| File | What it is |
| --- | --- |
| `Diwali_Events_2026_Add_All_QR.png` | QR to `add-calendar.html` |
| `Diwali_2026_Two_Events_QR.png` | QR to `diwali-only.html` (now the same all-events page) |
| `Diwali_2026_All_Events_Slide.png` | 16:9 slide, 3840x2160, all-events QR |
| `Diwali_2026_Diwali_Only_Slide.png` | 16:9 slide, 3840x2160, second QR |
| `Diwali_2026_Events_Slide.png` | 16:9 celebration slide, 3840x2160: header, all three event cards (built from `calendar.js`), mandir band. Rendered from `_events_slide.html` |
| `Diwali_2026_How_To_Add_Slide.png` | 16:9 how-to slide, 3840x2160: Step 1 scan, Step 2 tap Add to Calendar; all-events QR |
| `Diwali_2026_How_To_Add_Slide_Second_QR.png` | Same slide with the second (`diwali-only.html`) QR |
| `assets/preview-*.jpg` | 1200x630 link-preview cards referenced by `og:image` |

The how-to slides are rendered from `_steps_slide.html` (`?v=all` / `?v=second`) with the skill's `render_slides.cjs`. The phone is a real screenshot, `assets/slides/phone-add-calendar.png`, taken at 402x740 @3x; retake it if the page changes. Decode the QR from a crop of the finished slide: the full 3840px image trips jsQR because of the phone screenshot next to it.

Slides are rendered from `_flyer.html` with Playwright; the skill's
`scripts/render_slides.cjs` and `assets/slide-template.html` generalise it.
Decode a QR out of any regenerated slide before sharing it — scaling a QR into a
layout can break module alignment.

After changing event data, regenerate the standalone default calendar:

```sh
node -e "const fs=require('fs'); const c=require('./calendar.js'); fs.writeFileSync('Diwali_Events_Dallas_Frisco_2026.ics',c.buildCalendar(['kdc','evening']));"
```

Existing event UIDs are retained where possible, including the former pujan UID now assigned to the evening session. Its internal spelling is intentionally preserved for identity; displayed titles say Chopda. Importing again may still create duplicates depending on the calendar app. Old personal-site URLs in UIDs are identifiers, not download destinations.

## Verification

```sh
node --test tests/calendar.test.cjs
python3 -m http.server 8765 --bind 127.0.0.1
# With Playwright and its Chromium browser installed:
node tests/browser.cjs
```

Automated tests cover all six valid selection states, mandatory event inclusion, exact times and addresses, unique identities, descriptions, reminders, UTF-8 line folding, CRLF calendar format, actual browser downloads, card clicks, the dynamic download button and clearing optional choices, and layout overflow at 320/390/768/1280px.

The button downloads a local `.ics` file and never opens a subscription URL. Actual import/Add All behavior needs testing on a physical iPhone and Android device. Google Calendar users may need to import the file on a computer. The page provides brief import guidance without claiming that a download has already added events to a calendar.

## Before final distribution

- Confirm the provisional morning Chopda Pujan time.
- Supply event photos.
- Verify the deployed QR destination and test calendar import on real devices.

## Compact page revision

Removed the introductory text and section headings. Cards use small photo thumbnails, reduced spacing, and street-only display addresses; exported calendars retain the full venue locations. Chopda Pujan offers evening/morning choices side by side, followed by Kids Diwali Celebration. Both Annakut events remain mandatory; Chopda starts included with evening selected; KDC starts unchecked. Morning is the left-hand session choice and evening is on the right. A square checkbox controls whether Chopda is included. With no optional choice, Add all events downloads Dallas, Frisco, KDC, and evening Chopda (four events); the summary discloses this default. With any optional choice, Add selected events downloads only the required events plus those choices. Clear optional resets to the default.

Transparent logo produced with the built-in imagegen tool using the supplied logo as the edit target. Prompt: remove the cream background to genuine alpha transparency while preserving the lamp, ornamentation, colors, composition, and exact BAPS DIWALI 2026 text.

## Pages and QR codes

- Full page: https://bapsdallas.github.io/Diwali2026/add-calendar.html
- Full-page QR: `Diwali_Events_2026_Add_All_QR.png` (unchanged destination).
- Second page: https://bapsdallas.github.io/Diwali2026/diwali-only.html — since 2026-09-22 it shows every event, identical to the full page apart from its link-preview tags. The URL is kept so the printed second QR still works.
- Second QR: `Diwali_2026_Two_Events_QR.png` (unchanged).
- `Diwali_Only_2026.ics` is no longer linked from either page; it is kept, holding just the Dallas Diwali & Annakut, for anyone with a direct link.

`add-calendar.html` and `diwali-only.html` are identical apart from their link-preview (`og:`) tags, and a test asserts they render the same. The logo sits in a round glass badge.

Backup layout: `diwali-only-banner.html` keeps the photo-on-top cards (`banner.css`) for a page showing only one or two events. It is not behind any QR and is marked `noindex`. Choose its events with `data-cards` on `<body>` (currently `dallas`). The photo-on-top layout applies only for one or two cards; with three or more, `page.js` leaves the page in the `add-calendar.html` layout, since the banners get too thin. To use it for the second QR, copy its `<body>` attributes and the `banner.css` link into `diwali-only.html`. For conflicting programmatic pujan inputs, the generator keeps the 4 PM session and excludes the 6 PM one; the UI uses a radio group to prevent the conflict.

Latest visual update: uniform compact card heights on the full page, and larger, clearer date accents. Session selectors are radio controls styled as a two-part choice; inclusion uses the same square checkbox as KDC.

# Diwali 2026 Calendar

Mobile-first BAPS Dallas and Frisco event selection page. Two Annakut celebrations are always included. Kids Diwali and the two Chopda Pujan sessions can be selected independently. The download is generated from those choices, with eight possible combinations.

## Site and publishing

Repository: https://github.com/BAPSDallas/Diwali2026

QR destination: https://bapsdallas.github.io/Diwali2026/add-calendar.html

GitHub Pages should publish from `main`, folder `/ (root)` using **Settings → Pages → Deploy from a branch**. `.nojekyll` keeps deployment static. No build system, framework, server, or external JavaScript dependencies are needed.

Repository write access is confirmed. Enabling GitHub Pages requires the repository owner to configure the main branch and root folder in Settings → Pages. Verify the page at the QR destination after publishing, before distributing the QR.

## Events

All dates are in 2026 and times are America/Chicago. Event dates are retained from the supplied handoff. Times and selections follow the updated user request.

| Event | Date | Time | Included |
| --- | --- | --- | --- |
| Diwali & Annakut (Nutan Varsh), Dallas TX | November 10 | 11 AM–8 PM | Always |
| Diwali & Annakut (Nutan Varsh), Frisco TX | November 14 | 11 AM–8 PM | Always |
| Kids Diwali Celebration (KDC), Dallas TX | October 31 | 10 AM–6 PM | Optional |
| Chopda Pujan (Morning), Dallas TX | November 8 | 9–11 AM, provisional | Optional |
| Chopda Pujan (Evening), Dallas TX | November 8 | 5–7 PM | Optional |

Every event includes its full address, a description containing only `https://www.baps.org/dallas`, and reminders one week and one day beforehand.

Dallas events: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038. This matches the address on the official [BAPS Dallas site](https://www.baps.org/Dallas).

Frisco: BAPS Shri Swaminarayan Mandir, 9190 Sam Rayburn Tollway S, Frisco, TX 75035, retained from the supplied event file; organizer confirmation remains recommended.

## Editing

- `calendar.js` is the source of truth for event data and calendar generation.
- `page.js` renders cards and handles selection and download.
- `styles.css` supplies the responsive layout, artwork framing, and photo placeholders.
- `assets/diwali-logo.png` and `assets/festival-background.png` preserve the supplied originals. `assets/diwali-logo-transparent.png` is the extracted transparent logo used over the glass-style page.
- Set an event's `image` in `calendar.js` to a relative path such as `assets/kdc.jpg` when photos arrive. The page automatically replaces that card's decorative photo placeholder.
- `index.html` redirects the site root to `add-calendar.html`.
- `PROJECT_SUMMARY.md` records the original handoff and has superseded event information. This README and calendar.js describe the current requirements.

After changing event data, regenerate the standalone all-five-events calendar:

```sh
node -e "const fs=require('fs'); const c=require('./calendar.js'); fs.writeFileSync('Diwali_Events_Dallas_Frisco_2026.ics',c.buildCalendar(c.events.map(e=>e.id)));"
```

Existing event UIDs are retained where possible, including the former pujan UID now assigned to the evening session. Its internal spelling is intentionally preserved for identity; displayed titles say Chopda. Importing again may still create duplicates depending on the calendar app. Old personal-site URLs in UIDs are identifiers, not download destinations.

## Verification

```sh
node --test tests/calendar.test.cjs
python3 -m http.server 8765 --bind 127.0.0.1
# With Playwright and its Chromium browser installed:
node tests/browser.cjs
```

Automated tests cover all eight combinations, mandatory event inclusion, exact times and addresses, unique identities, descriptions, reminders, UTF-8 line folding, CRLF calendar format, actual browser downloads, card clicks, Add all events / Clear optional, and layout overflow at 320/390/768/1280px.

The button downloads a local `.ics` file and never opens a subscription URL. Actual import/Add All behavior needs testing on a physical iPhone and Android device. Google Calendar users may need to import the file on a computer. The page provides brief import guidance without claiming that a download has already added events to a calendar.

## Before final distribution

- Confirm the provisional morning Chopda Pujan time.
- Supply event photos and confirm the Frisco address.
- Verify the deployed QR destination and test calendar import on real devices.

## Compact page revision

Removed the introductory text and section headings. Cards use small photo thumbnails, reduced spacing, and street-only display addresses; exported calendars retain the full venue locations. Optional card order is evening Chopda Pujan, Kids Diwali Celebration, then morning Chopda Pujan. Both Annakut events remain mandatory; all optional events start unchecked. The bottom bar offers Add selected, Add all events, and Clear optional.

Transparent logo produced with the built-in imagegen tool using the supplied logo as the edit target. Prompt: remove the cream background to genuine alpha transparency while preserving the lamp, ornamentation, colors, composition, and exact BAPS DIWALI 2026 text.

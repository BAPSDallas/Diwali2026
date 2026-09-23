# Diwali 2026 calendar — project summary

A static, dependency-free site that lets someone scan a QR code and add BAPS Dallas
and Frisco Diwali events to their phone calendar. No accounts, no calendar
subscription, no build step, no server.

- Repository: https://github.com/BAPSDallas/Diwali2026
- Published: https://bapsdallas.github.io/Diwali2026/ (GitHub Pages, `main`, root folder)
- `README.md` and `calendar.js` are authoritative for event data. This file is the
  orientation document; the original handoff is preserved at the end.

## The two pages

| Page | Shows | QR code |
| --- | --- | --- |
| `add-calendar.html` | All four event slots. Both Annakut celebrations are always included; Kids Diwali is optional; Chopda Pujan offers a mutually exclusive Morning/Evening session. | `Diwali_Events_2026_Add_All_QR.png` |
| `diwali-only.html` | Identical to `add-calendar.html` (since 2026-09-23); only its link preview differs. | `Diwali_2026_Two_Events_QR.png` |
| `diwali-only-banner.html` | Backup: photo-on-top cards for one or two events (`data-cards`), not behind any QR. | — |

Both build the `.ics` in the browser from a Blob and hand it to the user as a
download. Nothing points at a hosted `.ics` URL, because iOS Calendar treats a
remote `.ics` link as a *subscription* rather than an import — that was the original
problem this project exists to solve. Do not "simplify" a button back into a direct
link to an `.ics` file.

`index.html` redirects the site root to `add-calendar.html`.

## Events

All dates are 2026, all times America/Chicago. Every event carries its full address,
a description of `https://www.baps.org/dallas`, and reminders one week and one day
before.

| Event | Date | Time | Included |
| --- | --- | --- | --- |
| Diwali & Annakut (Nutan Varsh), Dallas | Tue, November 10 | 12 PM – 8 PM | Always |
| Kids Diwali Celebration (KDC), Dallas | Sat, October 31 | 10 AM – 6 PM | Optional |
| Chopda Pujan (4 PM Session), Dallas | Sun, November 8 | 4 – 6 PM | Optional |
| Chopda Pujan (6 PM Session), Dallas | Sun, November 8 | 6 – 8 PM | Optional, selected by default |

The Frisco Diwali & Annakut was removed on 2026-09-22.

Dallas: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038.

## Files

| File | Role |
| --- | --- |
| `calendar.js` | Source of truth for event data and `.ics` generation. Shared by the pages and the tests. |
| `page.js` | Builds the cards, handles selection, triggers the download. Shared by both pages; `body[data-scope=diwali]` switches it to two-event mode. |
| `styles.css` | The whole design system, loaded by both pages. |
| `banner.css` | Loaded *after* `styles.css` by the backup page only. Every rule is scoped to `body.banner`, which `page.js` sets only for one or two cards. |
| `assets/events/*.png` | Event photos, replaceable without touching code. See `IMAGES.md`. |
| `tests/` | Unit tests for the calendar output, Playwright tests for the pages. |
| `_flyer.html` | Slide generator. Rendered to PNG with Playwright; not served to visitors. |
| `.claude/skills/save-the-date-site/` | Reusable skill: the whole workflow, layout recipes, ICS rules, and lessons learned. Committed on purpose. |

## Design decisions worth knowing before editing

These are the things that are easy to undo by accident.

**The pages are sized to fit one screen with no scrolling.** `body` has a definite
`height: 100svh` — not `min-height` — because a flex chain with only a minimum
height sizes to its content and refuses to shrink. The card grid uses
`grid-auto-rows: minmax(86px, 1fr)` so the cards absorb whatever height is left over.
Verified at zero overflow on iPhone 15, 17 Pro and 17 Pro Max, iPad and desktop.
Below 700 points tall there genuinely is not room, so a media query releases the
fixed height and lets those screens scroll rather than clipping card text.

**Glassmorphism only works if exactly one layer blurs.** `main` is pure layout with
no background and no `backdrop-filter`; the cards, hero and action bar each blur the
fixed backdrop directly. Giving `main` its own `backdrop-filter` over a
near-opaque background — as an earlier revision did — means the cards blur a flat
wash and the effect disappears entirely. The `brightness()` inside `--glass-blur` is
what keeps dark text legible over the dark maroon artwork.

**The date accent needs lining figures.** Georgia defaults to old-style figures,
where 3, 4, 7 and 9 drop below the baseline and 6 and 8 rise above it, so every card
cropped its numeral to a different height. The stack is Iowan Old Style (Apple),
Palatino Linotype (Windows), Times New Roman (everywhere else) — all lining. Do not
put Georgia back on `.date-num`. The numeral is sized in container query units
against the date column, so it fills correctly at any card height without
per-breakpoint tuning.

**Addresses join the city, state and ZIP with non-breaking spaces** so an address too
long for one line breaks after the street the way a postal address reads.

**Every title carries its city.** Two events are both called "Diwali & Annakut";
`cities` in `calendar.js` maps venue to a short label that `titleOf` appends, and
the subtitle no longer repeats it. Each title piece is `white-space: nowrap` so a
long title wraps between the name and the city.

**Android cannot import `.ics` and needs its own path.** Google Calendar for
Android has no import feature, so a downloaded file just sits in Downloads. The
page offers per-event Google Calendar template links (`render?action=TEMPLATE`,
one event per link, `ctz` for local times) in a sheet. An identified phone sees
only the calendar it can use; an ambiguous agent sees both. Do not remove one path in favour of the other — each is
the only thing that works on its platform.

**The Chopda Pujan card is a normal card.** Its Morning/Evening segmented toggle
occupies the same slot the time badge uses on the other cards, so it keeps the shared
height and silhouette instead of becoming a special case. The fixed-time cards render
their time in the same badge style, which is what makes the four read as one set.

**The accent is a layer, not a column.** `.date-rail` is absolutely positioned
over the right of the card with `pointer-events: none` and sits behind the text
(`z-index: 0` against the body's `1`). That is what gives titles and addresses
the full card width and keeps them on one line; putting it back in the flow
makes them wrap and the page stops fitting one screen. The checkbox re-enables
pointer events for itself, and the session toggle is capped so it cannot stretch
under the numeral.

**The pages never load the photo masters.** `scripts/optimise_images.py` derives
sized variants from everything listed in `assets/images.json`, and the pages
reference only those. This is not a quality trade: a 2248x1416 master drawn into
a 76x126 CSS px panel sends about 37x more pixels than a 3x screen can show, and
the browser discards the rest after paying to download them. Variants are encoded
at quality 90 and the background keeps every one of its pixels — only its format
changes. The four-card page went from 10.16 MB to 667 KB.

**Re-run the script after replacing any master.** A unit test runs it with
`--check` and fails with the offending filename if a master's hash no longer
matches its recorded derivatives, so a replaced photo cannot ship without them.

**srcset picks on width, but these panels crop on height.** The narrow card
panel needs ~228px across and ~377px down at 3x. Because candidate selection only
considers the element's layout width, a 320px variant would be chosen on a 2x
phone and then stretched vertically to fill the panel. That is why nothing below
640px is generated, and why `optimise_images.py` never upscales past a master's
own width — a width that does not exist on disk is a 404 and an empty card. The
per-photo width list is inlined into each page by the script for that reason.

**Chronological order comes from `calendar.js`, not from the renderer.** The
`events` array is declared oldest first, and the cards, the Google Calendar list
and the VEVENT sequence all inherit that order. Sorting in the renderer alone
would have left the sheet and the `.ics` disagreeing with the page. A unit test
asserts the array stays sorted.

**A `backdrop-filter` ancestor captures fixed-position descendants.** Both
dialogs used to sit inside `.action-bar`, which blurs its backdrop. That makes it
the containing block for `position: fixed` children, so `inset: 0` resolved to
the bar's own 89px rather than the viewport — the scrim dimmed only the bottom
strip and the panel was laid out inside it. `getComputedStyle().position` still
returned `fixed`, which is why the existing assertion passed; the test now
measures the scrim's box against the viewport.

**Help is per-device and numbered.** The dialog shows Apple steps on iPhone and
iPad, Google steps on Android, and a two-button picker on desktop where detection
tells us nothing. It reads the same `isIOS`/`isAndroid` result the action bar
does, so the steps always name the button actually on screen — a browser test
asserts step 1's bold text appears in the visible button's label. The wording
follows ASD-STE100: one instruction per step, imperative verbs, no passive voice.

**Venue colour is a token set, not a one-off.** `.event-card` declares
`--accent`, `--accent-rgb`, `--accent-label` and `--accent-shadow`, and every
card-level surface that carries the festival colour reads those rather than
`--red`. `.venue-frisco` restates them — plus `--glass` and `--glass-edge`, which
re-tint the card itself — to put Frisco in peacock teal. Two cards share the name
"Diwali & Annakut", so colour is what distinguishes them at a glance. The teal
glass is held more opaque than the cream cards: a thin teal wash over the maroon
backdrop turns olive rather than mint. A browser test asserts the two venues
differ on every accent surface, because a typo in the token block would silently
fall back to red and look deliberate.

**The fireworks marker is dormant.** No event carries the `fireworks` property,
and `assets/events/fireworks.svg` was removed on 2026-09-22. `.has-fireworks` in
the stylesheet and the generator in the skill (`make_fireworks_svg.py`) remain:
regenerate the SVG and set `fireworks: 'assets/events/fireworks.svg'` on an
event to bring it back. The tests count rendered markers against flagged events
rather than expecting a fixed number.

**The date lives only in the right-hand accent.** The label badge carries the
weekday and month (`TUESDAY · NOV`) and the numeral carries the day, so the card
body holds no written date. The Google Calendar sheet still spells the full date
out, since there the rows have no accent beside them.

**Link previews need explicit `og:` tags.** Scrapers only auto-pick images that
are large enough, which is why one page previewed and the other rendered as bare
text. Each page now declares its own `og:title` and a dedicated 1200x630
`og:image` under 600 KB — a multi-megabyte event photo works in iMessage and
fails in stricter clients.

## Changing things

- **Event data**: edit `calendar.js`, then regenerate the standalone default calendars
  (see `README.md` for the commands). Keep existing UIDs where possible.
- **Photos**: drop replacements into `assets/events/` with the same filenames. No code
  changes. `IMAGES.md` has the slot sizes and framing guidance — note that the
  Included/Optional chip sits over the top-left corner of each photo.
- **Layout**: prefer `styles.css`. Both live pages use only
  `styles.css`; `banner.css` is for the backup page alone.
- **Slides and previews**: edit `_flyer.html`, re-render, then re-decode the QR
  out of the finished PNG. The skill bundles scripts for both.

## Verifying

```sh
node --test tests/calendar.test.cjs          # calendar output
python3 -m http.server 8765 --bind 127.0.0.1 # then, with Playwright installed:
node tests/browser.cjs                       # pages, downloads, no-scroll on 17 Pro/Pro Max
```

The browser suite covers all six valid selection states, mutually exclusive Chopda
sessions, real downloads, responsive widths, and asserts both pages fit an iPhone
17 Pro and 17 Pro Max without scrolling.

## Open items

- Confirm the provisional Chopda Pujan morning time with the organisers.
- Confirm the Frisco address, retained from the supplied handoff.
- Replace the placeholder event photos with real ones.
- Test the end-to-end scan-to-import flow on real iPhones, then confirm Android
  behaviour.

---

# Appendix: original project handoff

Imported for reference and preserved unchanged. It describes the earlier KP_Profile
hosting and an earlier set of event times and spellings, **all since superseded** by
the sections above and by `calendar.js`. Kept because it records why the landing-page
approach was chosen over linking straight to an `.ics` file.

Diwali 2026 Calendar QR Project Summary

Goal

Create a simple QR-code experience for end users to add multiple Diwali-related events to their calendars without needing to know where the files are hosted.

Primary requirements:

    ●    One QR code
    ●    Multiple events
    ●    Different dates, times, descriptions, and addresses
    ●    iPhone/iOS first
    ●    Android support afterward
    ●    Avoid calendar subscription behavior
    ●    Prefer an import / Add All Events experience
    ●    Use the existing GitHub Pages repository for hosting

Existing GitHub Pages Site

Current public site:

https://krupesh9.github.io/KP_Profile/

The intent is not to modify the existing profile page itself.

The repository is only being used to host the calendar-related files.

Events Included

Event 1 — Annakut - Nutan Varsh 2026, Dallas

    ●    Date: November 10, 2026
    ●    Time: 11:00 AM - 9:00 PM
    ●    Location: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038
    ●    Description: Theme: Hinduism, Diwali Annakut 2026. 12 noon aarti and aarti every hour on top of the hour. 8:30 PM fireworks grand finale.
    ●    Reminders: 1 week before and 1 day before

Event 2 — Chopra Pujan 2026, Dallas TX

    ●    Date: Sunday, November 8, 2026
    ●    Time: 4:00 PM - 8:00 PM
    ●    Location: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038
    ●    Description: Currently blank
    ●    Reminders: 1 week before and 1 day before

Event 3 — Kids Diwali 2026 (KDC)

    ●    Date: October 31, 2026
    ●    Time: All day
    ●    Location: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038
    ●    Description: Placeholder: Will put some description
    ●    Reminders: 1 week before and 1 day before

Event 4 — Annakut - Nutan Varsh 2026, Frisco TX

    ●    Date: November 14, 2026
    ●    Time: 11:00 AM - 8:00 PM
    ●    Location: BAPS Shri Swaminarayan Mandir, 9190 Sam Rayburn Tollway S, Frisco, TX 75035
    ●    Description: Food stalls and aarti every hour
    ●    Reminders: 1 week before and 1 day before

Calendar File

A multi-event .ics file was created:

Diwali_Events_Dallas_Frisco_2026.ics

Configuration:

    ●    Time zone: America/Chicago
    ●    Four separate events
    ●    Two reminders per event
    ●    Proper all-day handling for Kids Diwali
    ●    One ICS file intended to work across Apple Calendar and compatible Android/calendar apps

First QR Approach

The first QR pointed directly to:

https://krupesh9.github.io/KP_Profile/Diwali_Events_Dallas_Frisco_2026.ics

Problem

On iPhone, opening a remote .ics URL caused Apple Calendar to interpret the file as a subscription calendar.

The screen displayed:

    ●    Add Subscription Calendar
    ●    The GitHub-hosted URL
    ●    A calendar title
    ●    Subscription/account options

This was not the desired user experience.

Revised iPhone Approach

A small landing page was created:

add-calendar.html

Planned public URL:

https://krupesh9.github.io/KP_Profile/add-calendar.html

A replacement QR code was created to point to that page instead of directly to the .ics file.

Intended user flow

    1.    User scans the QR code
    2.    A clean webpage opens
    3.    User taps Add All Events to Calendar
    4.    The browser creates/downloads the calendar file
    5.    iPhone imports the events instead of subscribing to a remote calendar feed

The page embeds the ICS calendar data directly and creates the .ics file locally when the button is tapped.

This avoids sending the user directly to the public .ics URL.

Current Files

Calendar file

Diwali_Events_Dallas_Frisco_2026.ics

Landing page

add-calendar.html

Replacement QR code

Diwali_Events_2026_Add_All_QR.png

The replacement QR points to:

https://krupesh9.github.io/KP_Profile/add-calendar.html

Hosting Notes

The existing GitHub profile page should remain unchanged.

Only the calendar-related files need to be added to the repository, preferably at the repository root:

    ●    add-calendar.html
    ●    Optionally keep Diwali_Events_Dallas_Frisco_2026.ics

Because add-calendar.html embeds the calendar data, its button does not need to send users to the hosted .ics URL.

Items to Review / Edit Next

    1.    Review and correct event names
    2.    Review spelling of temple names
    3.    Update event descriptions
    4.    Confirm all dates and times
    5.    Confirm exact Frisco address formatting
    6.    Decide whether reminders should remain 1 week + 1 day
    7.    Improve the landing-page design
    8.    Add organization/temple branding if desired
    9.    Add a short message such as:
Add all Diwali 2026 events to your calendar

    10.    Test the final flow on multiple iPhones/iOS versions
    11.    Refine Android behavior afterward
    12.    Decide whether Android should:
    ●    download the same ICS file, or
    ●    use Google Calendar-specific buttons/links

Desired Final Experience

iPhone

Scan QR -> Landing Page -> Add All Events to Calendar -> Import Events

No subscription calendar.

No need for the user to know GitHub is being used for hosting.

Android

To be finalized after iPhone testing.

Goal:

Scan QR -> Landing Page -> Add Events

using the smoothest Google Calendar / Android-compatible behavior.

Next Testing Step

After uploading add-calendar.html to the KP_Profile GitHub Pages repository:

    1.    Open:
https://krupesh9.github.io/KP_Profile/add-calendar.html

    2.    Scan the replacement QR code from an iPhone
    3.    Tap Add All Events to Calendar
    4.    Confirm whether iOS shows an import/add-events flow instead of subscription
    5.    Capture a screenshot if another intermediate screen appears
    6.    Adjust the page as needed for iPhone Safari behavior

Project Objective

The final result should be simple enough for an event flyer:

Scan QR -> Add all events -> Done

No account setup, no calendar subscription, and no visible technical hosting details during the normal user experience.
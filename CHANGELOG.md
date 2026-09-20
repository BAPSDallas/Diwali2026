# Changelog

## 2026-09-20

- Bring calendar project into BAPSDallas/Diwali2026 with supplied Diwali branding.
- Add mobile event cards with two mandatory celebrations and three optional sessions.
- Correct Chopda Pujan spelling, split morning/evening sessions, and update all event times.
- Generate selection-specific calendars with full locations, BAPS link descriptions, and unchanged reminder intervals.
- Add photo placeholders, a persistent calendar action, QR download, and selection/browser tests.

- Compact glass-style revision: transparent logo, thumbnail cards, less padding, removed heading copy, and street-only displayed addresses.
- Prioritize evening Chopda Pujan, rename Kids Diwali Celebration, move morning last, and add separate selected/all download controls.

- Add exclusive morning/evening Chopda options in one row and a single dynamic calendar button.
- Add edge-to-edge photo slots, faded date accents, and stronger glass styling.
- Publish a separate two-event Diwali page, calendar, and QR using the previous design.

- Restore photo-first two-event cards, enlarge date accents, and align main-page card heights.
- Add a square Chopda inclusion checkbox with evening selected by default, and put morning before evening.
- Add shared replaceable PNG photo files and image-update instructions.

- Fit both pages on one screen: a single flex column sized to the visible viewport, with the card grid absorbing the leftover height. Verified with no scrolling on iPhone 15, 17 Pro and 17 Pro Max; screens shorter than 700 points scroll rather than clip.
- Make the glassmorphism actually render. The frame no longer stacks its own `backdrop-filter` over a near-opaque background, so the cards, hero and action bar blur the festival backdrop directly; a brightness lift keeps dark text readable over the maroon.
- Move the shared design system into `styles.css` for both pages. `diwali-only.css` now holds only the banner-layout override instead of a second copy of the base styles.
- Replace the boxed date rail with a layered date accent: month and weekday at the top, an oversized numeral rising from the bottom edge and cropped by the card, sized against the card with container query units.
- Show the full date (`Tuesday, November 10, 2026`) above the time on every card.
- Replace the cramped Chopda Pujan session grid with a two-segment Morning/Evening toggle that keeps the card the same height and shape as the others.
- Move the Included/Optional badge onto the photo and the checkbox into the date column, and narrow the photo panel.
- Make the date accent uniform, bolder and longer. Georgia's old-style figures gave every numeral a different height and baseline, so each card cropped differently; a lining-figure stack puts 8, 10, 14 and 31 on one cap height so they all crop identically.
- Show the full venue address including state and ZIP on every card, with the city/state/ZIP tail joined by non-breaking spaces so a wrapped address breaks after the street.
- Put the month and weekday on one line directly above the date numeral with nominal letter spacing, anchor the pair to the bottom of the card, and enlarge the numeral.
- Rewrite PROJECT_SUMMARY.md around the current project, keeping the original handoff as an appendix.
- Open up the card text into three groups (title and subtitle, date and time, address) by moving the dead space that vertical centring left above and below the block, and add padding under the address. Same rhythm on both pages.
- Make the whole Chopda Pujan card include or remove the event like the Kids Diwali card, keeping any chosen session and falling back to evening.
- Cover photo swaps in the tests: any resolution or aspect ratio must fill its panel with no layout shift or overflow.
- Mark the Dallas Annakut as the celebration with a fireworks finale, using a generated vector burst washed in behind its date column rather than a photo crop: 13 KB instead of 1.4 MB, crisp at any density, and framed without dragging the mandir roofline into view.
- Add Open Graph and Twitter Card metadata to both pages with distinct titles and dedicated 1200x630 preview images, so a shared link renders a card instead of bare text.
- Add two 16:9 QR slides for use in a deck, with the QR verified to decode from the finished render.
- Put the city in every displayed title (`Diwali & Annakut · Dallas`), since two events share a name and were indistinguishable on the cards and in the Google Calendar list. The subtitle drops the city it used to carry, and each title piece is kept unbreakable so a long title wraps between the name and the city rather than orphaning a word.
- Lift the date accent out of the layout and into a layer behind the text. With the accent no longer occupying a column, every title and address fits one line at full size down to 320px — previously three of four titles and most addresses wrapped.
- Take the written date out of the card body and let the right-hand accent carry it: the label badge now reads `TUESDAY · NOV` above the numeral. The time becomes a badge in the same style as the Chopda Pujan session segments, so every card shares one visual language whether its time is fixed or chosen.
- Shorten the Kids Diwali card title to `Kids Diwali · Dallas` so it stays on one line, and move the full name into the subtitle as `Kids Diwali Celebration (KDC)`. The calendar event title is unchanged.
- Show one calendar button per identified phone platform — "Add to Apple Calendar" on iPhone and iPad, "Add to Google Calendar" on Android — and both where the device is ambiguous, so a misread never leaves a visitor without a working path. iPad detection pairs the platform string with `maxTouchPoints > 0`, since iPadOS reports itself as a Mac.
- Redraw the fireworks burst as a chrysanthemum: 150+ curving filaments starting at varying radii with bright bulbs at their tips, instead of evenly spaced straight rays that read as a sunburst.
- Add a Google Calendar path for Android, which cannot import .ics at all: a sheet listing one prefilled `render?action=TEMPLATE` link per selected event. Android leads with it and falls back to the file; every other platform leads with the file and can still reach the list.
- Add `.claude/skills/save-the-date-site/`, a reusable skill capturing the workflow, layout recipes, ICS rules, bundled scripts, and lessons learned from building this site.

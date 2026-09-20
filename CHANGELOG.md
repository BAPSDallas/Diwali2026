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

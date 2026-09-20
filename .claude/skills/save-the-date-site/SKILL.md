---
name: save-the-date-site
description: >
  Build a complete "save the date" package for a set of real-world events: a
  one-screen mobile web page that adds events to the visitor's calendar, the
  .ics files behind it, QR codes, 16:9 QR slides for a deck, and link-preview
  metadata. Use this skill whenever someone wants people to scan a code and get
  events onto their phone calendar — festival or temple programmes, conference
  agendas, wedding weekends, school or sports calendars, open houses, church or
  community event series. Trigger it even when the request sounds small ("make a
  QR code for our event", "can people add this to their calendar?", "I need a
  slide with a QR code", "build an .ics for these dates") because the pieces are
  interlocking and the iOS subscription trap below sinks the naive version.
  Also trigger when editing an existing site built this way.
---

# Save-the-date event site

## What you are building

Five artefacts that depend on each other. Build them in this order.

1. **`calendar.js`** — the event data and an `.ics` generator. Single source of truth.
2. **A selection page** — mobile, fits one screen, visitor picks events and taps once.
3. **Standalone `.ics` files** — generated from the same code, for direct download.
4. **QR codes** — pointing at the page, never at an `.ics`.
5. **16:9 slides** — QR plus branding, for a deck or screen.

## The one rule that shapes everything

**A QR code must never point directly at a hosted `.ics` file.** iOS Calendar
interprets a remote `.ics` URL as a *subscription feed* — the visitor gets an
"Add Subscription Calendar" sheet asking for account details, which is not what
anyone wants and which many people abandon.

The fix is a landing page that holds the calendar data in JavaScript and builds
the file locally when a button is tapped:

```js
const url = URL.createObjectURL(new Blob([buildCalendar(ids)], { type: 'text/calendar;charset=utf-8' }));
const link = document.createElement('a');
link.href = url; link.download = 'Events.ics';
document.body.append(link); link.click(); link.remove();
setTimeout(() => URL.revokeObjectURL(url), 60000);
```

iOS then shows a normal *import* flow. If you ever find yourself "simplifying" a
button into a direct link to an `.ics`, you have reintroduced the original bug.

**And an `.ics` file alone does not serve Android at all.** Google Calendar's
Android app has no import function — it never has. A downloaded `.ics` lands in
Downloads and the visitor is left to find it and guess which app opens it; on a
phone with no Samsung Calendar, nothing does. So every one of these sites needs
a second path: a per-event Google Calendar template link, which opens the app
prefilled so the visitor only taps Save.

```js
new URLSearchParams({
  action: 'TEMPLATE', text: title,
  dates: `${date}T${start}/${date}T${end}`,   // local wall time, no Z
  ctz: 'America/Chicago',                     // ctz makes the times local
  location: address, details: url,
})
// -> https://calendar.google.com/calendar/render?<params>
```

The template form carries **one event per link** — there is no multi-event
variant — so n events genuinely means n taps. Present them as a list rather than
pretending one button can do it. Lead with the Google list on Android and the
`.ics` on everything else, but keep both reachable on every platform so a
user-agent misread never strands anyone.

## Interview first

Do not start building until you have these. Ask in one batch, not one at a time.

**Events** — for each: display name, subtitle, date, start and end time,
timezone, venue name and full address. Then:
- Which are always included, and which are optional for the visitor to pick?
- Are any two mutually exclusive (for example a morning and an evening session
  of the same ceremony)? These need a segmented toggle, not two checkboxes.
- Are any times provisional? Say so on the page or leave it out — do not invent.
- Does any single event need a marker the others do not (fireworks, livestream,
  childcare)? Model it as a property on the event, never as "the first card".
- **Do two events share a display name?** Common in multi-venue series. They need
  the distinguishing detail in the title *and* their own accent colour — text
  alone is too slow to scan. Ask whether the brand has a second colour, or pick
  the complement of the primary one.

**Branding**
- Logo file. Crucially: **does it have its own background plate, and is there a
  transparent version?** A logo that is dark artwork on a cream plate will vanish
  against a dark background, and the plate colour is often the best choice for a
  slide background because the logo then sits on it seamlessly.
- Background artwork, if any.
- Photos per event, and who supplies them.

**Destination**
- The exact public URL the QR will encode. You need this before generating QR
  codes or Open Graph tags, because both require absolute URLs.

**Output**
- Which surfaces: page only, or also slides, printed flyer, social card?
- Slide aspect — 16:9 is the safe default for a deck.

## Building it

Read `references/layout-recipes.md` before writing any CSS — it has the
one-screen layout, the glass recipe, and the date-accent pattern, each with the
specific trap that makes the naive version fail.

Read `references/ics-rules.md` before writing the generator — line folding,
CRLF, VTIMEZONE and alarm structure.

### Structure

```
calendar.js        event data + buildCalendar(ids) -> .ics text; also exported for tests
page.js            renders cards, handles selection, triggers the download
styles.css         the whole design system, shared by every page
<variant>.css      loaded after styles.css; ONLY the divergence, nothing else
index.html         redirect to the main page
tests/
```

Resist duplicating the stylesheet per page. On the project this skill came from,
the base CSS had been copied into a second file and the two drifted: one page
overrode `.address { margin-top }` and silently cancelled the shared spacing, so
the pages disagreed in a way nobody could see in either file alone.

### Scripts you do not need to rewrite

- `scripts/make_preview_images.py` — derives 1200×630 link-card images from
  event photos.
- `scripts/make_fireworks_svg.py` — generates a vector firework burst. Adapt the
  geometry for other decorative marks; the point is that a generated SVG beats a
  photo crop at small sizes.
- `scripts/render_slides.cjs` — renders `assets/slide-template.html` to PNG with
  Playwright and captures `pageerror`, which is how you catch a template that
  silently rendered nothing.
- `scripts/decode_qr.cjs` — decodes a QR from any PNG. Run it on the source code
  *and* on the finished slide.

## Verification that actually catches things

Automate these. Each one corresponds to a real failure that shipped.

| Check | Why |
| --- | --- |
| Every image path in `calendar.js` exists on disk | A renamed photo 404s and silently falls back to a placeholder |
| No vertical overflow at each target device height | The whole premise is "fits one screen" |
| No card's text is clipped at smaller heights | Shrinking cards to fit is worse than scrolling |
| Every photo aspect from 4000×1000 to 800×2400 fills its panel | Photos get swapped by hand later |
| Both QR codes decode to the expected URL, from the *finished* slide | Downscaling a QR can destroy module alignment |
| Every page has complete `og:` tags, images that exist and are under ~600 KB | Otherwise a shared link renders as bare text |
| `.ics` output byte-matches the committed files | Data edits must regenerate them |
| Two venues' accents differ on every surface that carries colour | A typo in a token block falls back to the inherited colour and looks deliberate |
| A dialog scrim's *measured* box covers the viewport | A `backdrop-filter` ancestor silently makes itself the containing block; computed position still reads `fixed` |
| Help steps name the same calendar the visible button does | The two live in different files and drift apart |
| Computed styles, not just behaviour, on click-revealed UI | A sheet can be fully functional and completely unstyled; nothing routine ever screenshots it |

Run the page in a real browser (Playwright) and capture `pageerror`. A silent JS
exception renders a page that looks like a CSS problem and wastes an hour.

When a check fails, ask whether it is asserting the right thing before you change
it. On this project a "must not scroll at 700px tall" assertion failed after a
spacing change — but 700px was below the threshold where the layout *deliberately*
switches to scrolling, so the assertion was wrong, not the code. Weakening a test
to get green is different from correcting a test that was testing the wrong thing,
and you should say out loud which one you are doing.

## Lessons learned

`references/lessons-learned.md` is the accumulated debugging from building one of
these end to end — layout, typography, images, iOS quirks, and the process
mistakes. Read it when something is not behaving, and add to it when you learn
something new. It will save more time than it costs.

## Working style that fits this task

**Measure before you adjust.** Large-looking gaps in a card turned out to be dead
space from vertical centring, not margins — the actual gaps were 1–4px. Ten
seconds with `getBoundingClientRect` beats three rounds of guessing.

**Budget vertical space arithmetically before designing.** Header + n × card +
gaps + footer against the real viewport height tells you immediately whether a
design is possible. This prevents building something beautiful that does not fit.

**Render and look at it.** Screenshot every change and actually inspect the
image. Several defects here — a wrapping badge, an orphaned ZIP, a numeral clipped
on its right edge, a whole template rendering blank — were invisible in the code
and obvious in the picture.

**Offer options with rendered previews, not adjectives.** When a visual direction
is unclear, build three variants, screenshot them, and let the person point. Much
faster than a paragraph describing each.

**Say what you did not do.** Scope that was dropped, a test that was changed, a
file left uncommitted, an interpretation you had to guess at — surface it plainly
rather than letting it be discovered later.

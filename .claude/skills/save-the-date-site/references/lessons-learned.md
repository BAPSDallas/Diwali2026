# Lessons learned

Every entry below is a real defect that shipped or nearly shipped while building
one of these sites. They are grouped by where they bite.

## iOS and calendars

**A remote `.ics` URL is a subscription, not an import.** Covered in SKILL.md
because it shapes the whole architecture. Land on an HTML page; build the file
in-browser from a Blob.

**Android needs a completely separate path from iOS.** An `.ics` download is the
right answer on iOS and a dead end on Android, because Google Calendar for
Android cannot import `.ics` at all. Symptom as reported by a user: "Android is
just downloading the file." Do not try to fix this with a different MIME type, a
`webcal://` scheme or an intent URL — the app simply has no import feature.

Use Google's `render?action=TEMPLATE` link, one per event, which opens Google
Calendar prefilled. Because it is one event per link, design for a list. A sheet
that opens over the page works well: it does not disturb a one-screen layout,
and ticking off each row as it is tapped tells the visitor how far through they
are, which matters when they are bouncing between two apps.

Offer both calendars side by side, each with its brand mark, and let the device
decide only which one is *filled in* — Apple filled on iOS and desktop, Google
filled on Android, the other outlined. Detection should move emphasis, never
remove a path: user-agent sniffing misfires on tablets, ChromeOS and in-app
browsers, and neither path works on the other's platform, so hiding one can
strand a visitor completely. Two visible buttons also answer the question
"which one do I press?" without anyone reading a sentence.

iPadOS 13+ reports itself as a Mac, so `navigator.platform === 'MacIntel' &&
navigator.maxTouchPoints > 1` is what actually identifies an iPad.

**iOS Safari ignores `background-attachment: fixed`.** Use a real fixed layer:

```css
body::before { content: ''; position: fixed; inset: 0; z-index: -2;
  background: var(--page) url('bg.png') center top / cover no-repeat; }
```

This is also what a child's `backdrop-filter` samples, so you need it anyway.

**Safari's viewport is not the screen.** An iPhone 17 Pro is 402×874 CSS px, but
Safari's visible content height with toolbars shown is about 740. Use `svh` (the
*smallest* viewport height) so the layout survives toolbars being expanded. `vh`
and `dvh` both let content hide behind chrome.

## Layout

**`height`, not `min-height`, on the flex container.** A flex chain whose root
only has `min-height` has no definite size to distribute, so children size to
their content and refuse to shrink — the page silently scrolls. The fix is one
line:

```css
body { height: 100vh; height: 100svh; display: flex; flex-direction: column; }
```

Pair it with `min-height: 0` on every flex item in the chain, or the automatic
minimum size stops them shrinking anyway.

**Let the grid absorb the leftover height.** `grid-auto-rows: minmax(86px, 1fr)`
on the card container makes cards share whatever space is left after the fixed
chrome. No per-device tuning.

**Below a threshold, scroll rather than crush.** Squeezing cards until text
clips is worse than a scrollbar. Pick the smallest device you actually support,
and below it release the fixed height:

```css
@media (max-height: 700px) {
  body { height: auto; min-height: 100svh; }
  .cards { grid-auto-rows: auto; max-height: none; }
}
```

**Vertical space is the scarce resource.** Moving a badge onto the photo as an
absolutely positioned chip and the checkbox into the date column freed ~20px per
card — enough for a full date line. Look for elements that can ride on top of
something else instead of taking a row.

## Glassmorphism

**Exactly one layer may blur.** If a container has `backdrop-filter` *and* a
near-opaque background, its children's `backdrop-filter` blurs the parent's
already-flat composite and does nothing. Symptom: "the glass has no effect."

Make the container pure layout — no background, no filter — and let each card,
header and toolbar blur the fixed backdrop directly.

**Add `brightness()` inside the backdrop filter.** Light glass over a dark
backdrop leaves dark text unreadable. Lifting the backdrop before the translucent
overlay is what buys the contrast:

```css
--glass: linear-gradient(150deg, rgba(255,252,246,.84), rgba(255,246,231,.7));
--glass-blur: blur(26px) saturate(145%) brightness(1.5);
```

Tune `brightness` against your actual backdrop; 1.5 suited a dark maroon.

## Typography

**Georgia has old-style figures.** 3, 4, 7 and 9 descend below the baseline;
6 and 8 rise above it. For body text this is elegant. For a large date numeral
it means every card has a different glyph height and baseline, so a bottom crop
lands somewhere different on each one — it reads as sloppy and no amount of size
tuning fixes it.

Use a lining-figure stack:

```css
font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Times New Roman', serif;
font-variant-numeric: lining-nums;
font-feature-settings: 'lnum' 1;
```

Iowan covers Apple, Palatino Linotype covers Windows, Times New Roman is the
universal fallback. All three are lining by default.

**Container query units size a numeral against its own box.** To make one
numeral fill cards of different heights without breakpoints:

```css
.date-rail { container-type: size; }   /* needs a definite size: a stretched flex item qualifies */
.date-num  { font-size: min(94cqh, 88cqw); }
```

Clamp on `cqw` too, or a two-digit numeral overflows its column horizontally.
`container-type: size` implies `contain: size layout style`, which also makes the
element a containing block for absolutely positioned children — convenient, but
remember its contents can no longer influence its size.

**Control where a title wraps, or it will orphan a word.** "Diwali & Annakut ·
Dallas" broke as "Diwali &" / "Annakut · Dallas". Wrapping each piece in its own
`white-space: nowrap` span forces the break to land between the name and the
city. `text-wrap: balance` made it worse here — balancing line lengths is the
wrong objective when one specific break point is the readable one.

**When several events share a name, put the distinguishing detail in the title.**
Two cards both reading "Diwali & Annakut" are indistinguishable at a glance and,
worse, indistinguishable in a list of calendar links. Carry a short label (the
city) in a lookup keyed by venue and append it to every displayed title, then
strip it from the subtitle so the two do not repeat each other.

**Non-breaking spaces control where an address breaks.** Join the city/state/ZIP
tail so a long address wraps after the street instead of orphaning the ZIP:

```js
const [, street, city, stateZip] = full.split(', ');
return `${street}, ${`${city}, ${stateZip}`.replace(/ /g, ' ')}`;
```

`text-wrap: balance` is not a substitute — it balanced line lengths and split
"Tollway S" across lines.

## Images

**`object-fit: cover` on a fixed-size panel makes any resolution safe.** Verified
from 120×80 to 4000×1000 and 800×2400: the panel size never moves and nothing
letterboxes. Position the image absolutely and give it `width:100%; height:100%`.

**The crop is what the photo owner controls, so document it.** Give them the
measured panel dimensions and what survives — "76×126, so only the middle third
of a landscape photo" — rather than "use a nice photo".

**Filenames are a contract.** Renaming a photo 404s it, the error handler
substitutes a placeholder, and the page looks fine-but-wrong. Add a test:

```js
for (const event of events) if (event.image) assert(fs.existsSync(event.image));
```

**PNG is the wrong format for photographs.** Four event photos came in at 11.5 MB
total as PNG; the same images at 1200px wide as quality-82 JPEG were 1.1 MB. On a
page people reach by scanning a QR code on mobile data, that difference matters.

**A firework is filaments, not rays.** Evenly spaced straight lines from a single
centre read as a sun or an asterisk no matter how you colour them. What makes a
burst look like a burst: many fine strands (150+, not 50), each curving slightly
via a quadratic control point pushed off-axis, starting at *varying* inner radii
so the centre does not collapse to a point, with widely varying lengths, and a
small bright bulb at every tip. Shuffle the draw order so the layers interleave
instead of stacking.

**Generate small decorative marks as SVG, not photo crops.** A firework burst
cropped from a photo was 1.4 MB and muddy at 90×128; a generated SVG was 13 KB,
crisp at any density, and its palette could be tuned to the card. Randomise ray
length, width and opacity from a fixed seed so it looks organic but renders
identically every build.

**Percentage `background-position` crops to a detail — and zooming out betrays
you.** `background: url(x) 81% 13% / auto 250%` frames a burst in the upper right
of a photo. Each time the zoom was reduced, the building below it crept into
frame. Compute the visible window rather than nudging by eye:

```
displayed_height = container_height * size_pct
visible_top_fraction = (displayed_height - container_height) * position_pct / displayed_height
```

## Link previews

**No `og:` tags means the scraper guesses.** Apple's scraper auto-picks the
largest image on the page, so a page with a big banner previews and a page with
small thumbnails renders as bare text. Add explicit tags to every page:
`og:type`, `og:title`, `og:description`, `og:url`, `og:image` (absolute URL),
`og:image:width/height`, and `twitter:card`.

**Give `og:image` its own derived file.** Link cards want 1200×630 (1.91:1) and a
small payload; several scrapers cap fetch size or time out. A 3.8 MB event photo
technically works in iMessage and fails elsewhere. `scripts/make_preview_images.py`
derives correct cards from the same photos.

**Give each page a distinct `og:title` and `og:image`.** Two links with identical
metadata are indistinguishable when shared, which defeats having two pages.

**Previews cache hard.** After deploying, a fresh conversation or a `?v=2` suffix
forces a re-scrape.

## QR codes

**Decode them — before and after.** Decode the source PNG to confirm what it
encodes, then decode it again out of the finished slide, because scaling a QR
into a layout can break module alignment. `scripts/decode_qr.cjs` does both.

**Give the code a white card with generous padding.** That guarantees the quiet
zone regardless of what the source PNG includes, and `image-rendering: pixelated`
keeps module edges hard when scaling.

**Omit the URL as fallback text if the whole point is hiding the hosting.** Worth
a conscious decision either way.

## JavaScript traps

**`const top` collides with `window.top`.** In a classic script this throws
`Identifier 'top' has already been declared`, the whole script dies, and you get
a page that renders background and empty containers — which looks exactly like a
CSS problem. Always attach a `pageerror` listener when driving a page with
Playwright; it turns a half-hour hunt into one line of output.

## Process

**Measure before adjusting.** "The gaps look too big" turned out to be 1–4px
gaps with 16px of dead space above and below from vertical centring. The fix was
redistributing the dead space, which is the opposite of what tweaking margins
would have done.

**Budget the space arithmetically first.** Header + n × card + gaps + toolbar
against the real viewport height tells you in seconds whether a design fits.

**Screenshot and look.** A wrapping badge, an orphaned ZIP, a numeral clipped on
its right edge, and an entirely blank template were all invisible in the code.

**Offer rendered variants when a visual direction is unclear.** Three screenshots
beat three paragraphs, and the person can just point.

**A failing test may be the wrong test.** After a spacing change, a "must not
scroll at 402×700" assertion failed — but 700px was below the threshold where the
layout deliberately starts scrolling, so the assertion was testing a promise the
design never made. Splitting it into "no scroll on real devices" and "no clipped
text on short screens" was a tightening, not a loosening. State which one you are
doing.

**Model per-event traits as data.** A "fireworks" marker belongs on the event
object, not on "the first card". Position-based special cases break the moment
the order changes, and data-driven ones naturally appear everywhere the event is
rendered — which may itself be worth flagging to the user.

**Verify against the deployed site, not just locally.** GitHub Pages takes a
minute and caches; confirm the live page serves what you think before calling it
done.

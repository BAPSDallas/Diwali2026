# Layout recipes

Working CSS for the pieces that are easy to get subtly wrong. Each includes the
trap, because the naive version usually looks fine until it does not.

## One screen, no scrolling

```css
body {
  height: 100vh; height: 100svh;      /* definite height, smallest viewport */
  display: flex; flex-direction: column;
}
main    { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.content{ flex: 1; min-height: 0; display: flex; flex-direction: column; }
.cards  { flex: 1; min-height: 0; max-height: 560px;
          display: grid; grid-auto-rows: minmax(86px, 1fr); gap: 7px; }
.action-bar { flex: none; position: sticky; bottom: 0; }
```

**Trap:** `min-height: 100svh` instead of `height` gives the flex chain no
definite size, so cards size to content and the page scrolls. `min-height: 0` on
every item in the chain is equally required — without it the automatic minimum
size blocks shrinking.

**Trap:** `vh` and `dvh` let content hide behind Safari's toolbars. `svh` is the
smallest viewport and therefore the safe one.

Put all cards in one grid track even if they come from two containers, so every
card gets the same height:

```html
<div class="cards"><div id="included"></div><div id="optional"></div></div>
```
```css
#included, #optional { display: contents; }
```

Below your smallest supported height, release the fixed height and let it scroll
rather than clipping text (see lessons-learned).

## Glass

```css
:root {
  --glass: linear-gradient(150deg, rgba(255,252,246,.84), rgba(255,246,231,.7));
  --glass-blur: blur(26px) saturate(145%) brightness(1.5);
  --glass-edge: rgba(255,255,255,.58);
  --glass-shadow: 0 10px 28px rgba(52,6,2,.3), inset 0 1px 0 rgba(255,255,255,.75);
}
.card {
  background: var(--glass);
  -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge); box-shadow: var(--glass-shadow);
}
```

**Trap:** the container holding these must have no background and no
`backdrop-filter` of its own, or the children blur a flat composite and the
effect vanishes. **Trap:** without `brightness()` in the filter, dark text over a
dark backdrop is unreadable.

## Date accent

An oversized numeral in a full-height right column, cropped by the card edge.

```css
.date-rail {
  flex: 0 0 80px; align-self: stretch; position: relative;
  container-type: size;                     /* size the numeral against this box */
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-end;                /* labels ride on top of the numeral */
  overflow: hidden;
}
.date-labels { flex: none; font-size: 10px; font-weight: 700; letter-spacing: .02em;
               white-space: nowrap; text-transform: uppercase; }
.date-num {
  flex: none; margin-bottom: -.1em;         /* overhang; overflow does the cropping */
  font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Times New Roman', serif;
  font-variant-numeric: lining-nums; font-feature-settings: 'lnum' 1;
  font-size: clamp(46px, 13vw, 76px);       /* fallback first */
  font-size: min(100cqh, 94cqw);            /* then container units */
  line-height: .78; opacity: .5;
  align-self: center;                       /* see the single-digit note below */
}
```

**Centre the numeral, do not align it to an edge.** Dates run 1–31, so some cards
show one digit and some two. Aligned flush to either edge, a lone "8" sits visibly
off-centre under its label badge while "14" fills the column. Centring costs
nothing for two digits and fixes one.

**Trap:** Georgia's old-style figures make each numeral crop to a different
height. **Trap:** clamp on `cqw` as well as `cqh`, or two digits overflow the
column sideways.

**Make it a layer, not a column.** As a flex child the accent eats 90-100px of
every card, which is usually the difference between a title fitting on one line
and wrapping. Absolutely position it over the right edge instead and put it
behind the text:

```css
.card-main  { position: relative; }
.event-body { position: relative; z-index: 1; }
.date-rail  { position: absolute; top: 0; right: 0; bottom: 0; width: 104px;
              pointer-events: none; container-type: size; }
/* Controls inside the accent must re-enable pointer events AND lift themselves
   above the body, since the accent itself deliberately has no z-index. */
.date-rail input { position: absolute; z-index: 2; pointer-events: auto; }
```

**Trap: do not put `z-index: 0` on the accent.** It is the obvious way to push it
behind the body, and it works visually — but it creates a stacking context, and
every descendant is then trapped below the body's `z-index: 1` no matter what
they declare. A checkbox inside the accent becomes unclickable: visible, focusable
by keyboard, dead to taps. Leave the accent with no `z-index` at all — its
content paints under the positioned body anyway — and lift only the controls.

The text lines are short and left-aligned, so they never actually reach the
numeral; only full-width children need capping (`max-width: calc(100% - 96px)`)
to stop them stretching under it. Container query units still work, because the
element keeps a definite size.

## Mutually exclusive choice inside a card

A segmented toggle keeps the card the same height and shape as its neighbours,
where a second row of radio buttons makes it an obvious special case.

```html
<div class="session-toggle" role="radiogroup" aria-label="Session">
  <label class="session"><input type="radio" name="s" value="morning"><strong>Morning</strong><span>9–11 AM</span></label>
  <label class="session"><input type="radio" name="s" value="evening" checked><strong>Evening</strong><span>5–7 PM</span></label>
</div>
```

Hide the inputs with `position:absolute; inset:0; opacity:0` so the whole segment
is the tap target and focus still works, and give `.session:focus-within` a
visible outline. Aim for a 36px minimum segment height.

Give a card whose time is *fixed* the same filled badge the selected segment
uses. A chosen time and a given time are both settled, so styling them alike is
what makes a mixed set of cards read as one family — an outlined badge next to a
filled one implies a choice that is not there. Assert the two match in a test;
the rules live apart and drift.

If the card as a whole is also selectable, make the card click toggle inclusion
and ignore clicks originating inside the toggle or on the checkbox:

```js
card.addEventListener('click', event => {
  if (event.target === checkbox || event.target.closest('.session-toggle')) return;
  checkbox.checked = !checkbox.checked;
  if (checkbox.checked && !sessions.some(i => i.checked)) defaultSession.checked = true;
  update();
});
```

A card containing other labels must be an `<article>`, not a `<label>` — nested
labels are invalid and misbehave.

## Reclaiming vertical space

- Badge as an absolutely positioned chip over the photo, not a row in the text.
- Selection control inside the date column rather than its own row.
- `text-wrap: balance` on headings; non-breaking spaces to steer address breaks.

Each of these bought roughly a text line per card.

## Telling two similar cards apart by colour

Multi-venue series often repeat a name — two "Diwali & Annakut" cards differing
only by city. Colour separates them faster than text does, but only if the whole
card commits: one teal word among maroon reads as a mistake.

Declare the accent as tokens on the card, not on `:root`, so a venue can restate
the set in one block:

```css
.event-card {
  --accent: var(--red);
  --accent-rgb: 140, 29, 22;      /* for rgba(var(--accent-rgb), .4) borders */
  --accent-label: #9c3a1c;
  --accent-shadow: rgba(92, 12, 6, .35);
}

.venue-frisco {
  --accent: #0c5b56;
  --accent-rgb: 12, 91, 86;
  --accent-label: #0a4a46;
  --accent-shadow: rgba(4, 46, 44, .35);
  /* Restating the glass tokens re-tints the card surface itself, because
     .event-card already paints background and border from them. */
  --glass: linear-gradient(150deg, rgba(232, 253, 249, .93), rgba(180, 231, 224, .88));
  --glass-edge: rgba(12, 91, 86, .34);
}
```

Then swap every card-level `var(--red)` for `var(--accent)` — time badge, date
numeral, label badge, checkbox `accent-color`, selected border, session segments.
Page chrome (buttons, sheet) keeps `--red`; it belongs to the page, not a venue.

Three things that bite:

- **Pick the complement, not a second shade.** Teal against maroon reads as a
  different place. Orange against maroon reads as a rendering bug.
- **A tinted glass card needs more opacity than a neutral one.** At the alpha
  that looks right for cream, a teal wash lets the warm backdrop through and
  goes olive. Raise it until the tint is clean, then re-check the blur still
  reads as glass.
- **Assert the difference in a test.** A typo in the token block falls back to
  the inherited accent and looks intentional. Compare computed styles across
  venues on every surface that carries the colour:

```js
const read = venue => { const card = document.querySelector(`.venue-${venue}`); /* ... */ };
for (const key of ['time','rail','label','surface','border'])
  assert.notEqual(frisco[key], dallas[key], `must differ in ${key}`);
```

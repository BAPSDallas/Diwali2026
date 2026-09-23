'use strict';
const { events, addresses, cities, selectedEvents, buildCalendar, googleCalendarUrl } = DiwaliCalendar;
const optionalInputs = [];
let pujanIncluded;

const byId = id => events.find(event => event.id === id);

/* Every displayed title carries its city. The subtitle then drops the trailing
   ", Dallas TX" it used to end with, so the two do not repeat each other. */
const titleOf = event => `${event.name} · ${cities[event.venue]}`;

/* Build the title as two unbreakable pieces so a long one wraps between the
   name and the city, rather than orphaning a word like "Diwali &". */
function titleNode(event) {
  const h2 = element('h2');
  h2.append(element('span', 'title-name', event.name),
            ' ',
            element('span', 'title-city', `· ${cities[event.venue]}`));
  return h2;
}
const subtitleOf = event => event.subtitle.replace(/ · Dallas TX$/, '');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/* "Tuesday, November 10" + "20261110" -> { weekday: 'TUE', month: 'NOV', day: '10' } */
function railParts(event) {
  const [weekday, monthAndDay] = event.dateLabel.split(', ');
  return {
    weekday: weekday.toUpperCase(),
    month: monthAndDay.split(' ')[0].slice(0, 3).toUpperCase(),
    day: String(Number(event.date.slice(6)))
  };
}

/* Drop only the mandir name; street, city, state and ZIP all stay. Street and
   locality are separate lines rather than one string left to wrap, so every card
   breaks in the same place at every width, the way a postal address reads. */
function addressNode(venue) {
  const [, street, city, stateZip] = addresses[venue].split(', ');
  const node = element('p', 'address');
  node.append(element('span', '', `${street},`), element('span', '', `${city}, ${stateZip}`));
  return node;
}

/* Which variants exist, per photo — inlined into the page by
   scripts/optimise_images.py, because each master has its own ceiling and
   advertising a width that was never generated is a 404 and an empty card.

   Nothing below 640 is generated on purpose: srcset picks a candidate from the
   element's WIDTH alone, but these panels are cover-cropped and the narrow one
   is driven by its HEIGHT. A 320px candidate would be chosen on a 2x phone and
   then stretched vertically to fill the panel. */
const photoWidths = id => (window.PHOTO_WIDTHS || {})[id] || [1024];

/* One file per width, per format. The browser takes the first <source> it can
   decode, so WebP leads and the JPEG carries older devices. */
function sourceSet(base, extension, widths) {
  return widths.map(width => `${base}-${width}.${extension} ${width}w`).join(', ');
}

/* Which cards this page shows. A page may narrow the list with data-cards;
   the default is every event. */
const cardIds = document.body.dataset.cards
  ? document.body.dataset.cards.split(',').map(id => id.trim())
  : ['kdc', 'evening', 'dallas'];

/* The photo-on-top layout (banner.css) only works for one or two cards: with
   three or more the banners get too thin, so the page keeps the add-calendar
   layout instead. The class is what every banner.css rule is scoped to. */
const bannerLayout = document.body.dataset.layout === 'banner' && cardIds.length <= 2;
document.body.classList.toggle('banner', bannerLayout);

/* The side panel on add-calendar is ~92px wide whatever the viewport; in the
   banner layout the photo spans the full card. Telling the browser the real
   display width is what lets it skip the large files. */
const PHOTO_SIZES = bannerLayout ? '(max-width: 560px) 100vw, 538px' : '92px';

function makePhoto(event) {
  const photo = element('div', `event-photo ${event.id}`);
  photo.append(element('span', 'badge', event.required ? 'Included' : 'Optional'));
  if (event.image) {
    const base = event.image.replace(/\.[a-z]+$/, '');
    const widths = photoWidths(event.id);
    const picture = element('picture');
    const webp = element('source');
    webp.type = 'image/webp';
    webp.sizes = PHOTO_SIZES;
    webp.srcset = sourceSet(base, 'webp', widths);
    const image = element('img');
    /* sizes before srcset: the selection is made when srcset is assigned, and
       a sizes value arriving afterwards does not always trigger a re-pick. */
    image.sizes = PHOTO_SIZES;
    image.srcset = sourceSet(base, 'jpg', widths);
    image.src = `${base}-${widths[0]}.jpg`;
    image.alt = '';
    image.decoding = 'async';
    /* The cards are all on the first screen, so none of this is below the fold;
       lazy-loading them would only delay what the visitor came to read. The
       blurred placeholder in lqip.css is what fills the gap meanwhile. */
    image.loading = 'eager';
    image.addEventListener('load', () => photo.classList.add('loaded'));
    image.addEventListener('error', () => {
      picture.remove();
      photo.append(element('span', 'photo-motif', '✦'));
    });
    picture.append(webp, image);
    photo.append(picture);
  } else {
    photo.append(element('span', 'photo-motif', '✦'));
  }
  return photo;
}

/* Month and weekday sit on one line directly above an oversized numeral, the
   pair anchored to the bottom so the numeral is cropped by the card edge. */
function makeDateRail(event) {
  const { weekday, month, day } = railParts(event);
  const rail = element('div', 'date-rail');
  if (event.fireworks) {
    rail.classList.add('has-fireworks');
    rail.style.setProperty('--fireworks', `url('${event.fireworks}')`);
  }
  const labels = element('div', 'date-labels', `${weekday} · ${month}`);
  labels.setAttribute('aria-hidden', 'true');
  const numeral = element('strong', 'date-num', day);
  numeral.setAttribute('aria-hidden', 'true');
  rail.append(labels, numeral);
  return rail;
}

function makeCard(event, selectable = false) {
  const card = element(selectable ? 'label' : 'article', `event-card venue-${event.venue}${event.required ? ' included' : ''}`);
  const body = element('div', 'event-body');
  body.append(titleNode(event), element('p', 'subtitle', subtitleOf(event)));
  body.append(element('p', 'event-time', event.timeLabel));
  body.append(addressNode(event.venue));

  const rail = makeDateRail(event);
  if (selectable) {
    const input = element('input');
    input.type = 'checkbox';
    input.value = event.id;
    // Every event starts selected; the visitor removes what they will not attend.
    input.checked = true;
    input.setAttribute('aria-label', `Include ${event.name}, ${event.subtitle}, ${event.dateLabel}`);
    optionalInputs.push(input);
    input.addEventListener('change', updateSelection);
    rail.prepend(input);
  }

  const main = element('div', 'card-main');
  main.append(body, rail);
  card.append(makePhoto(event), main);
  return card;
}

/* Both sessions are in the evening and are labelled by their times alone. The
   ids stay 'morning' and 'evening' so the UIDs, and any copy a visitor has
   already imported, carry over. */
/* The Chopda Pujan card keeps the shared silhouette; the time line becomes a
   two-segment session picker so the card stays the same height as the others. */
function makePujanCard() {
  const card = makeCard(byId('evening'));
  card.classList.add('pujan-card');

  pujanIncluded = element('input');
  pujanIncluded.type = 'checkbox';
  pujanIncluded.id = 'pujan-included';
  pujanIncluded.checked = true;
  pujanIncluded.setAttribute('aria-label', 'Include Chopda Pujan');
  pujanIncluded.addEventListener('change', updateSelection);
  card.querySelector('.date-rail').prepend(pujanIncluded);

  const toggle = element('div', 'session-toggle');
  toggle.setAttribute('role', 'radiogroup');
  toggle.setAttribute('aria-label', 'Chopda Pujan session');
  const sessions = [];
  for (const id of ['morning', 'evening']) {
    const event = byId(id);
    const choice = element('label', 'session session-choice');
    const input = element('input');
    input.type = 'radio';
    input.name = 'pujan';
    input.value = id;
    input.checked = id === 'evening';
    input.setAttribute('aria-label', `Chopda Pujan, ${event.timeLabel}`);
    input.addEventListener('change', () => { pujanIncluded.checked = true; updateSelection(); });
    optionalInputs.push(input);
    sessions.push(input);
    choice.append(input, element('span', '', event.timeLabel));
    toggle.append(choice);
  }

  card.querySelector('.event-time').replaceWith(toggle);

  /* Tapping anywhere else on the card includes or removes Chopda Pujan, the way
     the Kids Diwali card behaves. An already-chosen session is kept; 6 PM – 8 PM
     is the fallback. Taps on the session toggle or the checkbox handle themselves. */
  card.addEventListener('click', event => {
    if (event.target === pujanIncluded || event.target.closest('.session-toggle')) return;
    pujanIncluded.checked = !pujanIncluded.checked;
    if (pujanIncluded.checked && !sessions.some(input => input.checked)) {
      sessions.find(input => input.value === 'evening').checked = true;
    }
    updateSelection();
  });

  return card;
}

/* Cards run in the order the celebrations happen, so the page reads as a
   calendar rather than as "the fixed ones, then the optional ones". The Chopda
   Pujan card stands in for both of its sessions, so it is keyed by the evening
   event — the two share a date, so either would sort to the same place. */
const cards = cardIds
  .map(byId)
  .sort((a, b) => a.date.localeCompare(b.date))
  .map(event => event.id === 'evening' ? makePujanCard() : makeCard(event, !event.required));
document.getElementById('cards').append(...cards);

const ids = () => optionalInputs.filter(input => input.checked && (input.type !== 'radio' || pujanIncluded.checked)).map(input => input.value);
// With nothing chosen, fall back to the default selection — limited to the
// cards this page actually shows.
const fallbackIds = ['kdc', 'evening'].filter(id => cardIds.includes(id));
const downloadIds = () => ids().length ? ids() : fallbackIds;
const plural = n => `${n} event${n === 1 ? '' : 's'}`;

function updateSelection() {
  for (const input of optionalInputs) {
    if (input.type === 'radio') input.closest('.session').classList.toggle('selected', input.checked);
    else input.closest('.event-card').classList.toggle('selected', input.checked);
  }
  if (pujanIncluded) pujanIncluded.closest('.event-card').classList.toggle('selected', pujanIncluded.checked);
  const hasChoice = ids().length > 0;
  // The button names the calendar; the summary line above it carries the count.
  const count = selectedEvents(downloadIds()).length;
  document.getElementById('selection-count').textContent = hasChoice ? `${plural(count)} selected`
    : fallbackIds.includes('evening') ? `${plural(count)} · 6 PM – 8 PM pujan included`
    : `${plural(count)} included`;
  document.getElementById('clear').hidden = !hasChoice;
  document.getElementById('download-status').textContent = '';
}

const clear = document.getElementById('clear');
if (clear) clear.addEventListener('click', () => {
  optionalInputs.forEach(input => { input.checked = input.value === 'evening'; });
  if (pujanIncluded) pujanIncluded.checked = false;
  updateSelection();
});

/* Android downloads the .ics into Downloads and leaves the visitor to find and
   open it, because Google Calendar's Android app cannot import .ics at all. So
   Android gets the Google Calendar list as the primary action and the file as
   the fallback; everyone else gets the reverse. Both paths stay reachable on
   every platform, so a wrong guess never strands anyone. */
const ua = navigator.userAgent;
const isAndroid = /Android/i.test(ua);
/* iPadOS 13+ reports itself as a Mac, so the touch check is what catches iPads.
   Macs have no touchscreen, so any touch points alongside a Mac platform string
   means iPad. */
const isIOS = /iPad|iPhone|iPod/.test(ua)
  || (/Mac/.test(navigator.platform || '') && navigator.maxTouchPoints > 0);
const sheet = document.getElementById('gcal-sheet');
const sheetList = document.getElementById('gcal-list');

/* Both dialogs close the same three ways — the Done button, a tap on the scrim
   outside the panel, and Escape — and hand focus back to whatever opened them,
   so keyboard users are not dropped at the top of the page. */
function wireDialog(dialogId, closeId, opener) {
  const dialog = document.getElementById(dialogId);
  const close = () => {
    dialog.hidden = true;
    document.getElementById(opener()).focus();
  };
  document.getElementById(closeId).addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dialog.hidden) close();
  });
  return close;
}

function openSheet() {
  sheetList.replaceChildren();
  for (const event of selectedEvents(downloadIds())) {
    const item = element('li', 'gcal-item');
    const text = element('div', '');
    text.append(element('strong', '', titleOf(event)), element('span', '', subtitleOf(event)),
                element('span', 'gcal-when', `${event.dateLabel} · ${event.timeLabel}`));
    const link = element('a', 'gcal-add', 'Add');
    link.href = googleCalendarUrl(event);
    link.target = '_blank';
    link.rel = 'noopener';
    // Tick it off so the visitor can see how far through the list they are.
    link.addEventListener('click', () => item.classList.add('added'));
    item.append(text, link);
    sheetList.append(item);
  }
  sheet.hidden = false;
  document.getElementById('sheet-close').focus();
}

wireDialog('gcal-sheet', 'sheet-close', () => isAndroid ? 'gcal' : 'download');
wireDialog('help-sheet', 'help-close', () => 'help');

document.getElementById('gcal').addEventListener('click', openSheet);
/* The help steps name the button the visitor will actually see, so they follow
   the same detection the action bar does. On a desktop we cannot know which
   calendar they use, so both are offered and the steps wait for a choice. */
const helpPicker = document.getElementById('help-picker');

function showSteps(platform) {
  for (const name of ['apple', 'google']) {
    document.getElementById(`help-${name}`).hidden = name !== platform;
  }
  for (const button of helpPicker.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.help === platform));
  }
}

if (isIOS) showSteps('apple');
else if (isAndroid) showSteps('google');
else {
  helpPicker.hidden = false;
  document.getElementById('help-prompt').hidden = false;
  helpPicker.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) showSteps(button.dataset.help);
  });
}

document.getElementById('help').addEventListener('click', () => {
  document.getElementById('help-sheet').hidden = false;
  document.getElementById('help-close').focus();
});

/* On a phone we know which calendar the visitor has, so show only that one —
   Android cannot import .ics at all, and iPhones handle it natively. Anywhere we
   cannot tell (desktop, unknown agents) both stay on screen, because guessing
   wrong there would leave someone with no way to add anything. */
document.querySelector('.action-buttons')
  .classList.add(isIOS ? 'show-apple' : isAndroid ? 'show-google' : 'show-both');

document.getElementById('download').disabled = false;
document.getElementById('download').addEventListener('click', () => {
  try {
    const selection = downloadIds();
    const url = URL.createObjectURL(new Blob([buildCalendar(selection)], { type: 'text/calendar;charset=utf-8' }));
    const link = element('a');
    link.href = url;
    link.download = `Diwali_2026_${selectedEvents(selection).length}_Events.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    document.getElementById('download-status').textContent = 'Open the downloaded file to finish adding your events.';
  } catch (error) {
    document.getElementById('download-status').textContent = 'Download could not start. Please try Safari or Chrome.';
  }
});

updateSelection();

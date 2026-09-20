'use strict';
const { events, addresses, selectedEvents, buildCalendar } = DiwaliCalendar;
const diwaliOnly = document.body.dataset.scope === 'diwali';
const optionalInputs = [];
let pujanIncluded;

const byId = id => events.find(event => event.id === id);

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
    weekday: weekday.slice(0, 3).toUpperCase(),
    month: monthAndDay.split(' ')[0].slice(0, 3).toUpperCase(),
    day: String(Number(event.date.slice(6)))
  };
}

/* "9 AM – 11 AM" -> "9–11 AM" so the session segments can run larger type. */
const compactTime = label => label.replace(/(\d+) (AM|PM) – (\d+) \2/, '$1–$3 $2');

/* Drop only the mandir name; street, city, state and ZIP all stay. The
   city/state/ZIP tail is joined with non-breaking spaces so an address too long
   for one line breaks after the street, the way a postal address reads, rather
   than mid-street or with the ZIP orphaned. */
function shortAddress(venue) {
  const [, street, city, stateZip] = addresses[venue].split(', ');
  return `${street}, ${`${city}, ${stateZip}`.replace(/ /g, '\u00a0')}`;
}

function makePhoto(event) {
  const photo = element('div', `event-photo ${event.id}`);
  photo.append(element('span', 'badge', event.required ? 'Included' : 'Optional'));
  if (event.image) {
    const image = element('img');
    image.src = event.image;
    image.alt = '';
    image.addEventListener('error', () => {
      image.remove();
      photo.append(element('span', 'photo-motif', '✦'));
    });
    photo.append(image);
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
  const labels = element('div', 'date-labels', `${month} · ${weekday}`);
  labels.setAttribute('aria-hidden', 'true');
  const numeral = element('strong', 'date-num', day);
  numeral.setAttribute('aria-hidden', 'true');
  rail.append(labels, numeral);
  return rail;
}

function makeCard(event, selectable = false) {
  const card = element(selectable ? 'label' : 'article', `event-card${event.required ? ' included' : ''}`);
  const body = element('div', 'event-body');
  body.append(element('h2', '', event.name), element('p', 'subtitle', event.subtitle));
  body.append(element('p', 'event-date', `${event.dateLabel}, 2026`));
  body.append(element('p', 'event-time', event.timeLabel));
  body.append(element('p', 'address', shortAddress(event.venue)));

  const rail = makeDateRail(event);
  if (selectable) {
    const input = element('input');
    input.type = 'checkbox';
    input.value = event.id;
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

/* The Chopda Pujan card keeps the shared silhouette; the time line becomes a
   two-segment session picker so the card stays the same height as the others. */
function makePujanCard() {
  const card = makeCard(byId('evening'));
  card.classList.add('pujan-card');
  card.querySelector('.subtitle').remove();

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
    input.setAttribute('aria-label', `${id === 'evening' ? 'Evening' : 'Morning'} Chopda Pujan, ${event.timeLabel}`);
    input.addEventListener('change', () => { pujanIncluded.checked = true; updateSelection(); });
    optionalInputs.push(input);
    sessions.push(input);
    choice.append(input, element('strong', '', id === 'evening' ? 'Evening' : 'Morning'), element('span', '', compactTime(event.timeLabel)));
    toggle.append(choice);
  }

  card.querySelector('.event-time').replaceWith(toggle);

  /* Tapping anywhere else on the card includes or removes Chopda Pujan, the way
     the Kids Diwali card behaves. An already-chosen session is kept; evening is
     the fallback. Taps on the session toggle or the checkbox handle themselves. */
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

for (const id of ['dallas', 'frisco']) document.getElementById('included').append(makeCard(byId(id)));
if (!diwaliOnly) document.getElementById('optional').append(makePujanCard(), makeCard(byId('kdc'), true));

const ids = () => optionalInputs.filter(input => input.checked && (input.type !== 'radio' || pujanIncluded.checked)).map(input => input.value);
const downloadIds = () => diwaliOnly ? [] : (ids().length ? ids() : ['kdc', 'evening']);

function updateSelection() {
  for (const input of optionalInputs) {
    if (input.type === 'radio') input.closest('.session').classList.toggle('selected', input.checked);
    else input.closest('.event-card').classList.toggle('selected', input.checked);
  }
  if (pujanIncluded) pujanIncluded.closest('.event-card').classList.toggle('selected', pujanIncluded.checked);
  const hasChoice = ids().length > 0;
  document.getElementById('download-label').textContent = hasChoice ? 'Add selected events' : 'Add all events';
  document.getElementById('selection-count').textContent = diwaliOnly
    ? '2 events included'
    : hasChoice ? `${selectedEvents(downloadIds()).length} events selected` : '4 events · evening pujan included';
  const clear = document.getElementById('clear');
  if (clear) clear.hidden = !hasChoice;
  document.getElementById('download-status').textContent = '';
}

const clear = document.getElementById('clear');
if (clear) clear.addEventListener('click', () => {
  optionalInputs.forEach(input => { input.checked = input.value === 'evening'; });
  if (pujanIncluded) pujanIncluded.checked = false;
  updateSelection();
});

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

'use strict';
const { events, addresses, selectedEvents, buildCalendar } = DiwaliCalendar;
const optionalInputs = [];
const displayOrder = ['dallas', 'frisco', 'evening', 'kdc', 'morning'];
for (const id of displayOrder) {
  const event = events.find(event => event.id === id);
  const card = document.createElement(event.required ? 'article' : 'label');
  card.className = `event-card${event.required ? ' included' : ''}`;
  const photo = document.createElement('div');
  photo.className = `event-photo ${event.id}`;
  photo.setAttribute('aria-hidden', 'true');
  if (event.image) {
    const image = document.createElement('img');
    image.src = event.image; image.alt = ''; image.loading = 'lazy'; photo.append(image);
  } else {
    const motif = document.createElement('span'); motif.className = 'photo-motif'; motif.textContent = '✦'; photo.append(motif);
    const caption = document.createElement('span'); caption.className = 'photo-caption'; caption.textContent = ''; photo.append(caption);
  }
  const content = document.createElement('div'); content.className = 'event-content';
  const top = document.createElement('div'); top.className = 'card-top';
  const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = event.required ? '✓ Included' : (event.id === 'evening' ? 'Main pujan · Optional' : 'Optional'); top.append(badge);
  if (!event.required) {
    const input = document.createElement('input'); input.type = 'checkbox'; input.value = event.id; input.setAttribute('aria-label', `Include ${event.name}, ${event.subtitle}`); optionalInputs.push(input); top.append(input);
    input.addEventListener('change', updateSelection);
  }
  content.append(top);
  for (const [tag, className, text] of [['h2', '', event.name], ['p', 'subtitle', event.subtitle], ['p', 'event-date', event.dateLabel.replace('Tuesday, November', 'Tue, Nov').replace('Saturday, November', 'Sat, Nov').replace('Sunday, November', 'Sun, Nov').replace('Saturday, October', 'Sat, Oct')], ['p', 'event-time', event.timeLabel]]) {
    const element = document.createElement(tag); element.className = className; element.textContent = text; content.append(element);
  }
  if (event.tentative) { const note = document.createElement('p'); note.className = 'tentative'; note.textContent = 'Morning time to be confirmed'; content.append(note); }
  const address = document.createElement('p'); address.className = 'address'; address.textContent = addresses[event.venue].replace('BAPS Shri Swaminarayan Mandir, ', ''); content.append(address);
  card.append(photo, content); document.getElementById(event.required ? 'included' : 'optional').append(card);
}
const ids = () => optionalInputs.filter(input => input.checked).map(input => input.value);
function updateSelection() {
  for (const input of optionalInputs) input.closest('.event-card').classList.toggle('selected', input.checked);
  document.getElementById('selection-count').textContent = `${selectedEvents(ids()).length} events selected`;
  document.getElementById('clear').disabled = !optionalInputs.some(input => input.checked);
  document.getElementById('download-status').textContent = '';
}
document.getElementById('clear').addEventListener('click', () => {
  optionalInputs.forEach(input => { input.checked = false; }); updateSelection();
});
function downloadCalendar(selection) {
  try {
    const url = URL.createObjectURL(new Blob([buildCalendar(selection)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `Diwali_2026_${selectedEvents(selection).length}_Events.ics`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    document.getElementById('download-status').textContent = 'Open the downloaded file to finish adding your events.';
  } catch (error) {
    document.getElementById('download-status').textContent = 'Download could not start. Please try Safari or Chrome.';
  }
}
for (const button of ['download', 'download-all']) document.getElementById(button).disabled = false;
document.getElementById('download').addEventListener('click', () => downloadCalendar(ids()));
document.getElementById('download-all').addEventListener('click', () => downloadCalendar(events.map(event => event.id)));
updateSelection();

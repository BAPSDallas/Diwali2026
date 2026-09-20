'use strict';
const { events, addresses, selectedEvents, buildCalendar } = DiwaliCalendar;
const diwaliOnly = document.body.dataset.scope === 'diwali';
const optionalInputs = [];
let pujanIncluded;
const byId = id => events.find(event => event.id === id);
function element(tag, className, text) {
  const node = document.createElement(tag); node.className = className;
  if (text) node.textContent = text;
  return node;
}
function makeCard(event, selectable = false) {
  const card = element(selectable ? 'label' : 'article', `event-card${event.required ? ' included' : ''}`);
  const photo = element('div', `event-photo ${event.id}`); photo.setAttribute('aria-hidden','true');
  if (event.image) {
    const image = element('img'); image.src = event.image; image.alt = ''; image.loading = 'lazy'; image.addEventListener('error', () => { image.remove(); photo.append(element('span','photo-motif','✦')); }); photo.append(image);
  } else photo.append(element('span','photo-motif','✦'));
  const content = element('div','event-content');
  const top = element('div','card-top'); top.append(element('span','badge',event.required ? '✓ Included' : 'Optional'));
  if (selectable) {
    const input = element('input'); input.type = 'checkbox'; input.value = event.id;
    input.setAttribute('aria-label',`Include ${event.name}, ${event.subtitle}`);
    optionalInputs.push(input); top.append(input); input.addEventListener('change',updateSelection);
  }
  content.append(top,element('h2','',event.name),element('p','subtitle',event.subtitle));
  const date = event.dateLabel.replace('Tuesday, November','Tue, Nov').replace('Saturday, November','Sat, Nov').replace('Sunday, November','Sun, Nov').replace('Saturday, October','Sat, Oct');
  content.append(element('p','event-date',date),element('p','event-time',event.timeLabel));
  content.append(element('p','address',addresses[event.venue].replace('BAPS Shri Swaminarayan Mandir, ','')));
  card.append(photo,content);
  {
    const accent = element('div','date-accent'); accent.setAttribute('aria-hidden','true');
    accent.append(element('span','',date.replace(/ \d+$/,'').toUpperCase()),element('strong','',String(Number(event.date.slice(-2)))));
    card.append(accent);
  }
  return card;
}
for (const id of ['dallas','frisco']) document.getElementById('included').append(makeCard(byId(id)));
if (!diwaliOnly) {
  const card = makeCard(byId('evening'));
  card.classList.add('pujan-card');
  card.querySelector('.subtitle').textContent = 'Dallas TX';
  pujanIncluded = element('input'); pujanIncluded.type = 'checkbox'; pujanIncluded.id = 'pujan-included'; pujanIncluded.checked = true;
  pujanIncluded.setAttribute('aria-label','Include Chopda Pujan');
  pujanIncluded.addEventListener('change',updateSelection);
  card.querySelector('.card-top').append(pujanIncluded);
  card.querySelector('.event-time').remove();
  const choices = element('div','pujan-choices'); choices.setAttribute('role','radiogroup'); choices.setAttribute('aria-label','Chopda Pujan session');
  for (const id of ['morning','evening']) {
    const event = byId(id);
    const label = element('label','session-choice');
    const input = element('input'); input.type = 'radio'; input.name = 'pujan'; input.value = id; input.checked = id === 'evening';
    input.setAttribute('aria-label',`${id === 'evening' ? 'Evening' : 'Morning'} Chopda Pujan, ${event.timeLabel}`);
    input.addEventListener('change',()=>{pujanIncluded.checked=true;updateSelection();}); optionalInputs.push(input);
    label.append(input,element('strong','',id === 'evening' ? 'Evening' : 'Morning'),element('span','',event.timeLabel));
    label.append(element('small','',id === 'evening' ? '' : 'Time tentative'));
    choices.append(label);
  }
  card.querySelector('.event-content').insertBefore(choices,card.querySelector('.address'));
  document.getElementById('optional').append(card,makeCard(byId('kdc'),true));
}
const ids = () => optionalInputs.filter(input=>input.checked && (input.type !== 'radio' || pujanIncluded.checked)).map(input=>input.value);
const downloadIds = () => diwaliOnly ? [] : (ids().length ? ids() : ['kdc','evening']);
function updateSelection() {
  for (const input of optionalInputs) {
    if (input.type === 'radio') input.closest('.session-choice').classList.toggle('selected',input.checked);
    else input.closest('.event-card').classList.toggle('selected',input.checked);
  }
  if (pujanIncluded) pujanIncluded.closest('.event-card').classList.toggle('selected',pujanIncluded.checked);
  const hasChoice = ids().length > 0;
  document.getElementById('download-label').textContent = hasChoice ? 'Add selected events' : 'Add all events';
  document.getElementById('selection-count').textContent = diwaliOnly ? '2 events included' : hasChoice ? `${selectedEvents(downloadIds()).length} events selected` : '4 events · evening pujan included';
  const clear = document.getElementById('clear'); if (clear) clear.hidden = !hasChoice;
  document.getElementById('download-status').textContent = '';
}
const clear = document.getElementById('clear');
if (clear) clear.addEventListener('click',()=>{optionalInputs.forEach(input=>{input.checked=input.value==='evening';});if(pujanIncluded)pujanIncluded.checked=false;updateSelection();});
document.getElementById('download').disabled=false;
document.getElementById('download').addEventListener('click',()=>{
  try {
    const selection = downloadIds();
    const url = URL.createObjectURL(new Blob([buildCalendar(selection)],{type:'text/calendar;charset=utf-8'}));
    const link = element('a'); link.href=url; link.download=`Diwali_2026_${selectedEvents(selection).length}_Events.ics`;
    document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000);
    document.getElementById('download-status').textContent='Open the downloaded file to finish adding your events.';
  } catch(error) {document.getElementById('download-status').textContent='Download could not start. Please try Safari or Chrome.';}
});
updateSelection();

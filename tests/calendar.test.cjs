const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { events, buildCalendar } = require('../calendar.js');
const optional = ['kdc', 'morning', 'evening'];
const unfold = text => text.replace(/\r\n /g, '');
for (let mask = 0; mask < 8; mask++) {
  test(`calendar selection combination ${mask}`, () => {
    const raw = optional.filter((_, i) => mask & (1 << i));
    const ids = raw.includes('morning') ? raw.filter(id => id !== 'evening') : raw;
    const calendar = buildCalendar(ids);
    const text = unfold(calendar);
    assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 2 + ids.length);
    assert.equal((text.match(/BEGIN:VALARM/g) || []).length, 2 * (2 + ids.length));
    for (const event of events) {
      assert.equal(text.includes(`UID:${event.uid}\r\n`), event.required || ids.includes(event.id));
    }
    assert(!/(?<!\r)\n/.test(calendar));
    assert(calendar.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
  });
}
test('all five events have exact requested times, titles, locations and description', () => {
  const text = unfold(buildCalendar(['kdc','morning'])) + unfold(buildCalendar(['evening']));
  const expected = [['dallas','20261110','110000','200000'], ['frisco','20261114','110000','200000'], ['kdc','20261031','100000','180000'], ['morning','20261108','090000','110000'], ['evening','20261108','170000','190000']];
  for (const [id, date, start, end] of expected) {
    const event = events.find(e => e.id === id);
    const block = text.split('BEGIN:VEVENT\r\n').find(b => b.startsWith(`UID:${event.uid}\r\n`));
    assert(block.includes(`DTSTART;TZID=America/Chicago:${date}T${start}\r\n`));
    assert(block.includes(`DTEND;TZID=America/Chicago:${date}T${end}\r\n`));
    assert(block.includes(id === 'frisco' ? 'Frisco TX' : 'Dallas TX'));
    assert(block.includes(id === 'frisco' ? '9190 Sam Rayburn Tollway S' : '4601 N State Hwy 161'));
    assert(block.includes('DESCRIPTION:https://www.baps.org/dallas\r\n'));
    for (const days of [7, 1]) assert(block.includes(`TRIGGER:-P${days}D\r\n`));
  }
  assert.equal(new Set(events.map(e => e.uid)).size, 5);
  assert(!text.includes('SUMMARY:Chopra'));
  assert(!text.includes('VALUE=DATE'));
  assert.equal(fs.readFileSync('Diwali_Events_Dallas_Frisco_2026.ics', 'utf8'), buildCalendar(['kdc','evening']));
  assert.equal(fs.readFileSync('Diwali_Only_2026.ics', 'utf8'), buildCalendar([]));
});
test('required events cannot be removed and duplicate or unknown IDs add nothing', () => {
  assert.equal(buildCalendar(['unknown', 'dallas', 'dallas']), buildCalendar([]));
});

test('conflicting pujan input never includes both sessions', () => {
 const text=buildCalendar(['morning','evening','kdc']);
 assert(text.includes('UID:chopda-pujan-morning'));
 assert(!text.includes('UID:chopra-pujan'));
 assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,4);
});

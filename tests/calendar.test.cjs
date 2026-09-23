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
    assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 1 + ids.length);
    assert.equal((text.match(/BEGIN:VALARM/g) || []).length, 2 * (1 + ids.length));
    for (const event of events) {
      assert.equal(text.includes(`UID:${event.uid}\r\n`), event.required || ids.includes(event.id));
    }
    assert(!/(?<!\r)\n/.test(calendar));
    assert(calendar.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
  });
}
test('all four events have exact requested times, titles, locations and description', () => {
  const text = unfold(buildCalendar(['kdc','morning'])) + unfold(buildCalendar(['evening']));
  const expected = [['dallas','20261110','120000','203000'], ['kdc','20261031','100000','170000'], ['morning','20261108','170000','180000'], ['evening','20261108','183000','193000']];
  for (const [id, date, start, end] of expected) {
    const event = events.find(e => e.id === id);
    const block = text.split('BEGIN:VEVENT\r\n').find(b => b.startsWith(`UID:${event.uid}\r\n`));
    assert(block.includes(`DTSTART;TZID=America/Chicago:${date}T${start}\r\n`));
    assert(block.includes(`DTEND;TZID=America/Chicago:${date}T${end}\r\n`));
    assert(block.includes('Dallas TX'));
    assert(block.includes('4601 N State Hwy 161'));
    // Chopda Pujan carries "Followed by Mahaprasad" above the link.
    assert(block.includes(event.note ? 'DESCRIPTION:Followed by Mahaprasad\\nhttps://www.baps.org/dallas\r\n' : 'DESCRIPTION:https://www.baps.org/dallas\r\n'));
    for (const days of [7, 1]) assert(block.includes(`TRIGGER:-P${days}D\r\n`));
  }
  assert.equal(new Set(events.map(e => e.uid)).size, 4);
  assert(!text.includes('SUMMARY:Chopra'));
  assert(!text.includes('VALUE=DATE'));
  assert(!/frisco/i.test(text), 'Frisco is no longer an event');
  assert.equal(fs.readFileSync('Diwali_Events_Dallas_Frisco_2026.ics', 'utf8'), buildCalendar(['kdc','evening']));
  assert.equal(fs.readFileSync('Diwali_Only_2026.ics', 'utf8'), buildCalendar([]));
});
test('image derivatives are current for every master', () => {
  // The whole point of the manifest is that replacing a photo cannot silently
  // ship the old variants — or none at all. This fails loudly with the command
  // to run. Skipped only where Pillow is unavailable, never quietly passed.
  const probe = require('node:child_process').spawnSync('python3', ['-c', 'import PIL']);
  if (probe.status !== 0) {
    console.log('  (skipped: Pillow not installed — run pip install Pillow)');
    return;
  }
  const result = require('node:child_process').spawnSync(
    'python3', ['scripts/optimise_images.py', '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `image variants are stale:\n${result.stdout}`);
});
test('every page advertises only photo widths that exist on disk', () => {
  // A width in the inlined map with no file behind it is a 404 and an empty
  // card. This is the check that catches a hand-edited map or a half-run build.
  for (const page of ['add-calendar.html', 'diwali-only.html', 'diwali-only-banner.html']) {
    const html = fs.readFileSync(page, 'utf8');
    const map = JSON.parse(html.match(/window\.PHOTO_WIDTHS=(\{.*?\});/)[1]);
    for (const event of events.filter(e => e.image && map[e.id])) {
      const base = event.image.replace(/\.[a-z]+$/, '');
      for (const width of map[event.id]) {
        for (const ext of ['webp', 'jpg']) {
          assert(fs.existsSync(`${base}-${width}.${ext}`),
            `${page} advertises ${base}-${width}.${ext}, which does not exist`);
        }
      }
    }
  }
});
test('events are declared oldest first, so every surface lists them in order', () => {
  // Declaration order is what the cards, the Google Calendar list and the VEVENT
  // sequence all inherit. Sorting in one place would leave the others disagreeing.
  const keys = events.map(event => event.date + event.start);
  assert.deepEqual(keys, [...keys].sort(), 'calendar.js events must be in chronological order');
});
test('any fireworks marker points at a real asset and never reaches the ICS', () => {
  // The marker is optional decoration; these hold whether or not one is set.
  for (const event of events.filter(event => event.fireworks)) {
    assert(fs.existsSync(event.fireworks), `missing ${event.fireworks}`);
  }
  assert(!buildCalendar(['kdc', 'evening']).toLowerCase().includes('firework'));
});

test('both pages carry distinct link-preview metadata pointing at real images', () => {
  // A missing or oversized og:image is why a shared link renders as bare text.
  const BASE = 'https://bapsdallas.github.io/Diwali2026/';
  const seen = new Map();
  for (const page of ['add-calendar.html', 'diwali-only.html']) {
    const html = fs.readFileSync(page, 'utf8');
    const meta = name => (html.match(new RegExp(`<meta property="og:${name}" content="([^"]+)"`)) || [])[1];
    for (const tag of ['type', 'title', 'description', 'url', 'image']) {
      assert(meta(tag), `${page} is missing og:${tag}`);
    }
    assert.equal(meta('url'), BASE + page, `${page} has the wrong og:url`);
    const image = meta('image');
    assert(image.startsWith(BASE), `${page} og:image must be an absolute URL`);
    const file = image.slice(BASE.length);
    assert(fs.existsSync(file), `${page} og:image points at a missing file: ${file}`);
    // Scrapers drop images that are slow to fetch; keep link cards small.
    const kb = fs.statSync(file).size / 1024;
    assert(kb < 600, `${page} og:image is ${Math.round(kb)} KB, too heavy for a link preview`);
    assert(!seen.has(image), `${page} reuses the og:image of ${seen.get(image)}`);
    seen.set(image, page);
    assert(!seen.has(meta('title')) , `${page} reuses another page's og:title`);
    seen.set(meta('title'), page);
  }
});

test('every event photo referenced by calendar.js exists on disk', () => {
  // Photos get swapped by hand, so a renamed file must fail here rather than
  // silently 404 and fall back to the placeholder motif on the live page.
  for (const event of events) {
    if (event.image) assert(fs.existsSync(event.image), `missing ${event.image}, referenced by "${event.id}"`);
  }
});

test('required events cannot be removed and duplicate or unknown IDs add nothing', () => {
  assert.equal(buildCalendar(['unknown', 'dallas', 'dallas']), buildCalendar([]));
});

test('conflicting pujan input never includes both sessions', () => {
 const text=buildCalendar(['morning','evening','kdc']);
 assert(text.includes('UID:chopda-pujan-morning'));
 assert(!text.includes('UID:chopra-pujan'));
 assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,3);
});

(function (root) {
  'use strict';
  const addresses = {
    dallas: 'BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038'
  };
  // Short city label per venue, used in every displayed title.
  const cities = { dallas: 'Dallas' };
  const events = [
    { id: 'kdc', uid: 'kids-diwali-kdc-2026@krupesh9.github.io', title: 'Kids Diwali Celebration (KDC) 2026, Dallas TX', name: 'Kids Diwali', subtitle: 'Kids Diwali Celebration (KDC) · Dallas TX', date: '20261031', start: '100000', end: '170000', dateLabel: 'Saturday, October 31', timeLabel: '10 AM – 5 PM', venue: 'dallas', required: false, image: 'assets/events/kids-diwali.png' },
    { id: 'morning', uid: 'chopda-pujan-morning-dallas-2026@bapsdallas.github.io', title: 'Sharda (Chopda) Pujan – Chopda Pujan 1 2026, Dallas TX', name: 'Sharda (Chopda) Pujan', session: 'Chopda Pujan 1', subtitle: 'Followed by Mahaprasad · Dallas TX', note: 'Followed by Mahaprasad', date: '20261108', start: '170000', end: '180000', dateLabel: 'Sunday, November 8', timeLabel: '5 PM – 6 PM', venue: 'dallas', required: false, image: 'assets/events/chopda-pujan.png' },
    { id: 'evening', uid: 'chopra-pujan-dallas-2026@krupesh9.github.io', title: 'Sharda (Chopda) Pujan – Chopda Pujan 2 2026, Dallas TX', name: 'Sharda (Chopda) Pujan', session: 'Chopda Pujan 2', subtitle: 'Followed by Mahaprasad · Dallas TX', note: 'Followed by Mahaprasad', date: '20261108', start: '183000', end: '193000', dateLabel: 'Sunday, November 8', timeLabel: '6:30 PM – 7:30 PM', venue: 'dallas', required: false, image: 'assets/events/chopda-pujan.png' },
    { id: 'dallas', uid: 'annakut-dallas-2026@krupesh9.github.io', title: 'Diwali & Annakut (Nutan Varsh) 2026, Dallas TX', name: 'Diwali & Annakut', subtitle: 'Nutan Varsh · Dallas TX', date: '20261110', start: '120000', end: '203000', dateLabel: 'Tuesday, November 10', timeLabel: '12 PM – 8:30 PM', venue: 'dallas', required: true, image: 'assets/events/dallas.png' }
  ];
  const TZID = 'America/Chicago';
  const timezone = ['BEGIN:VTIMEZONE', `TZID:${TZID}`, 'BEGIN:DAYLIGHT', 'DTSTART:19700308T020000', 'TZOFFSETFROM:-0600', 'TZOFFSETTO:-0500', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT', 'BEGIN:STANDARD', 'DTSTART:19701101T020000', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0600', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD', 'END:VTIMEZONE'];
  const escapeText = text => text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  function fold(line) {
    let result = '', length = 0;
    for (const char of line) {
      const bytes = new TextEncoder().encode(char).length;
      if (length + bytes > 75) { result += '\r\n '; length = 1; }
      result += char; length += bytes;
    }
    return result;
  }
  // Calendar notes: any event note ("Followed by Mahaprasad") above the link.
  const detailsOf = event => [event.note, 'https://www.baps.org/dallas'].filter(Boolean).join('\n');
  function selectedEvents(ids = []) {
    // The earlier session wins for conflicting programmatic input; the UI permits only one.
    const chosen = ids.includes('morning') ? ids.filter(id => id !== 'evening') : ids;
    return events.filter(event => event.required || chosen.includes(event.id));
  }
  function buildCalendar(ids = []) {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BAPS Dallas//Diwali 2026//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...timezone];
    for (const event of selectedEvents(ids)) {
      lines.push('BEGIN:VEVENT', `UID:${event.uid}`, 'DTSTAMP:20260923T180000Z', 'SEQUENCE:3', `SUMMARY:${escapeText(event.title)}`, `DTSTART;TZID=${TZID}:${event.date}T${event.start}`, `DTEND;TZID=${TZID}:${event.date}T${event.end}`, `LOCATION:${escapeText(addresses[event.venue])}`, `DESCRIPTION:${escapeText(detailsOf(event))}`, 'URL:https://www.baps.org/dallas');
      for (const days of [7, 1]) lines.push('BEGIN:VALARM', `TRIGGER:-P${days}D`, 'ACTION:DISPLAY', 'DESCRIPTION:Event reminder', 'END:VALARM');
      lines.push('END:VEVENT');
    }
    return [...lines, 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
  }
  /* Google Calendar for Android has no .ics import — a downloaded file just sits
     in Downloads. This link opens Google Calendar with the event prefilled so
     the visitor only has to tap Save. It carries exactly one event; Google's
     template form has no multi-event variant, which is why the UI lists them. */
  function googleCalendarUrl(event) {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${event.date}T${event.start}/${event.date}T${event.end}`,
      ctz: TZID,
      location: addresses[event.venue],
      details: detailsOf(event)
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  }

  const api = { events, addresses, cities, selectedEvents, buildCalendar, googleCalendarUrl };
  if (typeof module !== 'undefined') module.exports = api;
  else root.DiwaliCalendar = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

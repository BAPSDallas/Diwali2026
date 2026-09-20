(function (root) {
  'use strict';
  const addresses = {
    dallas: 'BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038',
    frisco: 'BAPS Shri Swaminarayan Mandir, 9190 Sam Rayburn Tollway S, Frisco, TX 75035'
  };
  // Short city label per venue, used in every displayed title. Two events share
  // the name "Diwali & Annakut", so the city is what tells them apart.
  const cities = { dallas: 'Dallas', frisco: 'Frisco' };
  const events = [
    { id: 'dallas', uid: 'annakut-dallas-2026@krupesh9.github.io', title: 'Diwali & Annakut (Nutan Varsh) 2026, Dallas TX', name: 'Diwali & Annakut', subtitle: 'Nutan Varsh · Dallas TX', date: '20261110', start: '110000', end: '200000', dateLabel: 'Tuesday, November 10', timeLabel: '11 AM – 8 PM', venue: 'dallas', required: true, fireworks: 'assets/events/fireworks.svg', image: 'assets/events/dallas.png' },
    { id: 'frisco', uid: 'annakut-frisco-2026@krupesh9.github.io', title: 'Diwali & Annakut (Nutan Varsh) 2026, Frisco TX', name: 'Diwali & Annakut', subtitle: 'Nutan Varsh · Frisco TX', date: '20261114', start: '110000', end: '200000', dateLabel: 'Saturday, November 14', timeLabel: '11 AM – 8 PM', venue: 'frisco', required: true, image: 'assets/events/frisco.png' },
    { id: 'kdc', uid: 'kids-diwali-kdc-2026@krupesh9.github.io', title: 'Kids Diwali Celebration (KDC) 2026, Dallas TX', name: 'Kids Diwali Celebration', subtitle: 'KDC · Dallas TX', date: '20261031', start: '100000', end: '180000', dateLabel: 'Saturday, October 31', timeLabel: '10 AM – 6 PM', venue: 'dallas', required: false, image: 'assets/events/kids-diwali.png' },
    { id: 'morning', uid: 'chopda-pujan-morning-dallas-2026@bapsdallas.github.io', title: 'Chopda Pujan (Morning) 2026, Dallas TX', name: 'Chopda Pujan', subtitle: 'Morning · Dallas TX', date: '20261108', start: '090000', end: '110000', dateLabel: 'Sunday, November 8', timeLabel: '9 AM – 11 AM', tentative: true, venue: 'dallas', required: false, image: 'assets/events/chopda-pujan.png' },
    { id: 'evening', uid: 'chopra-pujan-dallas-2026@krupesh9.github.io', title: 'Chopda Pujan (Evening) 2026, Dallas TX', name: 'Chopda Pujan', subtitle: 'Evening · Dallas TX', date: '20261108', start: '170000', end: '190000', dateLabel: 'Sunday, November 8', timeLabel: '5 PM – 7 PM', venue: 'dallas', required: false, image: 'assets/events/chopda-pujan.png' }
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
  function selectedEvents(ids = []) {
    // Morning wins for conflicting programmatic input; the UI permits only one session.
    const chosen = ids.includes('morning') ? ids.filter(id => id !== 'evening') : ids;
    return events.filter(event => event.required || chosen.includes(event.id));
  }
  function buildCalendar(ids = []) {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BAPS Dallas//Diwali 2026//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...timezone];
    for (const event of selectedEvents(ids)) {
      lines.push('BEGIN:VEVENT', `UID:${event.uid}`, 'DTSTAMP:20260920T180000Z', 'SEQUENCE:1', `SUMMARY:${escapeText(event.title)}`, `DTSTART;TZID=${TZID}:${event.date}T${event.start}`, `DTEND;TZID=${TZID}:${event.date}T${event.end}`, `LOCATION:${escapeText(addresses[event.venue])}`, 'DESCRIPTION:https://www.baps.org/dallas', 'URL:https://www.baps.org/dallas');
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
      details: 'https://www.baps.org/dallas'
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  }

  const api = { events, addresses, cities, selectedEvents, buildCalendar, googleCalendarUrl };
  if (typeof module !== 'undefined') module.exports = api;
  else root.DiwaliCalendar = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

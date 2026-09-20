# Writing the .ics generator

An `.ics` file is unforgiving about formatting and silently misimports when you
get it wrong. These are the rules that matter.

## Line endings and folding

Lines are CRLF terminated, and no line may exceed 75 **octets** — not
characters. A UTF-8 name can blow the limit at fewer than 75 characters, so fold
by byte length, continuing with CRLF followed by a single space:

```js
function fold(line) {
  let result = '', length = 0;
  for (const char of line) {
    const bytes = new TextEncoder().encode(char).length;
    if (length + bytes > 75) { result += '\r\n '; length = 1; }
    result += char; length += bytes;
  }
  return result;
}
```

Assert both in tests: every line ≤ 75 bytes, and no bare `\n` anywhere
(`assert(!/(?<!\r)\n/.test(calendar))`).

## Escaping

In text values, escape backslash, newline, semicolon and comma — in that order,
or you double-escape your own escapes:

```js
text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\;').replace(/,/g, '\\,');
```

## Timezones

Emit a `VTIMEZONE` block and reference it with `DTSTART;TZID=...`. Floating times
or a bare `Z` conversion will drift for anyone in another zone, and some clients
refuse an unknown `TZID` with no definition. Include both the daylight and
standard transitions with their `RRULE`s.

Avoid `VALUE=DATE` all-day events unless you genuinely mean all day — clients
differ on the exclusive end date and events land on the wrong day.

## Identity

`UID` is what a calendar uses to decide between updating an existing event and
creating a duplicate. Choose stable UIDs at the start and never change them,
even if a display name changes later. Keep a UID that has already been
distributed, even if it contains a typo or an old domain — it is an identifier,
not an address. Bump `SEQUENCE` when details change.

## Alarms

Two reminders is a reasonable default:

```
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:Event reminder
END:VALARM
```

## Testing

Enumerate every selection combination rather than spot-checking. With three
optional events that is eight cases and catches ordering and exclusivity bugs:

```js
for (let mask = 0; mask < 8; mask++) { /* build, assert event count, assert UIDs present/absent */ }
```

Also assert that any committed standalone `.ics` files byte-match what the
generator produces, so editing event data without regenerating them fails.

## Mutually exclusive events

If two events cannot both be chosen, enforce it in the generator as well as the
UI. The UI is one client; something else may call the generator:

```js
const chosen = ids.includes('morning') ? ids.filter(id => id !== 'evening') : ids;
```

Document which one wins.

# Original project handoff

Imported for reference. The KP_Profile hosting URLs below describe the previous project. Current work uses https://github.com/BAPSDallas/Diwali2026 and the intended Pages URL https://bapsdallas.github.io/Diwali2026/add-calendar.html. Items described as planned or requiring testing are not confirmed behavior.

---

Diwali 2026 Calendar QR Project Summary

Goal

Create a simple QR-code experience for end users to add multiple Diwali-related events to their calendars without needing to know where the files are hosted.

Primary requirements:

    ●    One QR code
    ●    Multiple events
    ●    Different dates, times, descriptions, and addresses
    ●    iPhone/iOS first
    ●    Android support afterward
    ●    Avoid calendar subscription behavior
    ●    Prefer an import / Add All Events experience
    ●    Use the existing GitHub Pages repository for hosting

Existing GitHub Pages Site

Current public site:

https://krupesh9.github.io/KP_Profile/

The intent is not to modify the existing profile page itself.

The repository is only being used to host the calendar-related files.

Events Included

Event 1 — Annakut - Nutan Varsh 2026, Dallas

    ●    Date: November 10, 2026
    ●    Time: 11:00 AM - 9:00 PM
    ●    Location: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038
    ●    Description: Theme: Hinduism, Diwali Annakut 2026. 12 noon aarti and aarti every hour on top of the hour. 8:30 PM fireworks grand finale.
    ●    Reminders: 1 week before and 1 day before

Event 2 — Chopra Pujan 2026, Dallas TX

    ●    Date: Sunday, November 8, 2026
    ●    Time: 4:00 PM - 8:00 PM
    ●    Location: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038
    ●    Description: Currently blank
    ●    Reminders: 1 week before and 1 day before

Event 3 — Kids Diwali 2026 (KDC)

    ●    Date: October 31, 2026
    ●    Time: All day
    ●    Location: BAPS Shri Swaminarayan Mandir, 4601 N State Hwy 161, Irving, TX 75038
    ●    Description: Placeholder: Will put some description
    ●    Reminders: 1 week before and 1 day before

Event 4 — Annakut - Nutan Varsh 2026, Frisco TX

    ●    Date: November 14, 2026
    ●    Time: 11:00 AM - 8:00 PM
    ●    Location: BAPS Shri Swaminarayan Mandir, 9190 Sam Rayburn Tollway S, Frisco, TX 75035
    ●    Description: Food stalls and aarti every hour
    ●    Reminders: 1 week before and 1 day before

Calendar File

A multi-event .ics file was created:

Diwali_Events_Dallas_Frisco_2026.ics

Configuration:

    ●    Time zone: America/Chicago
    ●    Four separate events
    ●    Two reminders per event
    ●    Proper all-day handling for Kids Diwali
    ●    One ICS file intended to work across Apple Calendar and compatible Android/calendar apps

First QR Approach

The first QR pointed directly to:

https://krupesh9.github.io/KP_Profile/Diwali_Events_Dallas_Frisco_2026.ics

Problem

On iPhone, opening a remote .ics URL caused Apple Calendar to interpret the file as a subscription calendar.

The screen displayed:

    ●    Add Subscription Calendar
    ●    The GitHub-hosted URL
    ●    A calendar title
    ●    Subscription/account options

This was not the desired user experience.

Revised iPhone Approach

A small landing page was created:

add-calendar.html

Planned public URL:

https://krupesh9.github.io/KP_Profile/add-calendar.html

A replacement QR code was created to point to that page instead of directly to the .ics file.

Intended user flow

    1.    User scans the QR code
    2.    A clean webpage opens
    3.    User taps Add All Events to Calendar
    4.    The browser creates/downloads the calendar file
    5.    iPhone imports the events instead of subscribing to a remote calendar feed

The page embeds the ICS calendar data directly and creates the .ics file locally when the button is tapped.

This avoids sending the user directly to the public .ics URL.

Current Files

Calendar file

Diwali_Events_Dallas_Frisco_2026.ics

Landing page

add-calendar.html

Replacement QR code

Diwali_Events_2026_Add_All_QR.png

The replacement QR points to:

https://krupesh9.github.io/KP_Profile/add-calendar.html

Hosting Notes

The existing GitHub profile page should remain unchanged.

Only the calendar-related files need to be added to the repository, preferably at the repository root:

    ●    add-calendar.html
    ●    Optionally keep Diwali_Events_Dallas_Frisco_2026.ics

Because add-calendar.html embeds the calendar data, its button does not need to send users to the hosted .ics URL.

Items to Review / Edit Next

    1.    Review and correct event names
    2.    Review spelling of temple names
    3.    Update event descriptions
    4.    Confirm all dates and times
    5.    Confirm exact Frisco address formatting
    6.    Decide whether reminders should remain 1 week + 1 day
    7.    Improve the landing-page design
    8.    Add organization/temple branding if desired
    9.    Add a short message such as:
Add all Diwali 2026 events to your calendar

    10.    Test the final flow on multiple iPhones/iOS versions
    11.    Refine Android behavior afterward
    12.    Decide whether Android should:
    ●    download the same ICS file, or
    ●    use Google Calendar-specific buttons/links

Desired Final Experience

iPhone

Scan QR -> Landing Page -> Add All Events to Calendar -> Import Events

No subscription calendar.

No need for the user to know GitHub is being used for hosting.

Android

To be finalized after iPhone testing.

Goal:

Scan QR -> Landing Page -> Add Events

using the smoothest Google Calendar / Android-compatible behavior.

Next Testing Step

After uploading add-calendar.html to the KP_Profile GitHub Pages repository:

    1.    Open:
https://krupesh9.github.io/KP_Profile/add-calendar.html

    2.    Scan the replacement QR code from an iPhone
    3.    Tap Add All Events to Calendar
    4.    Confirm whether iOS shows an import/add-events flow instead of subscription
    5.    Capture a screenshot if another intermediate screen appears
    6.    Adjust the page as needed for iPhone Safari behavior

Project Objective

The final result should be simple enough for an event flyer:

Scan QR -> Add all events -> Done

No account setup, no calendar subscription, and no visible technical hosting details during the normal user experience.
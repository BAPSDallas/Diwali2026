/* Offline cache for the Diwali 2026 pages.

   The aim is a second visit that works with no signal — at the mandir, in a car
   park, on a phone with no data left. The trade-off to respect is staleness:
   this site gets edited and redeployed often, so anything that could pin a
   visitor to an old page is not worth the speed.

   Hence two strategies:
   - Pages, styles and scripts: network first, cache as a fallback. A visitor
     online always gets the current version; offline they get the last one.
   - Images: cache first. They are content-addressed by width in their filename,
     so a changed photo means a changed URL, and a stale hit is impossible.

   Bump CACHE when the precache list changes; old caches are deleted on activate. */
const CACHE = 'diwali-2026-v5';

const PRECACHE = [
  'add-calendar.html', 'diwali-only.html', 'styles.css', 'lqip.css',
  'diwali-only.css', 'calendar.js', 'page.js',
  'assets/diwali-logo-360.webp', 'assets/diwali-logo-360.png',
  'assets/festival-background.webp'
];

self.addEventListener('install', event => {
  // addAll fails atomically if any entry 404s, which would leave no cache at
  // all; each file is added on its own so one bad path cannot poison the rest.
  event.waitUntil(caches.open(CACHE)
    .then(cache => Promise.all(PRECACHE.map(url => cache.add(url).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  const isImage = request.destination === 'image';
  event.respondWith(isImage ? cacheFirst(request) : networkFirst(request));
});

function cacheFirst(request) {
  return caches.match(request).then(hit => hit || fetch(request).then(response => store(request, response)));
}

function networkFirst(request) {
  return fetch(request)
    .then(response => store(request, response))
    .catch(() => caches.match(request).then(hit => hit || caches.match('add-calendar.html')));
}

function store(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(request, copy));
  }
  return response;
}

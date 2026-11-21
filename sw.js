/* Euro4All service worker: keeps the app working with no signal (on the ferry, in the village). */
const CACHE = "euro4all-v2";
const SHELL = [
  "./", "index.html", "css/app.css", "js/config.js", "js/content.js", "js/content-extra.js", "js/app.js",
  "vendor/qrcode.min.js", "vendor/jsQR.min.js", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname.endsWith("supabase.co")) return;              // live data: always network
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  const save = res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (isFont) {                                                   // fonts: cache first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(save)));
    return;
  }
  // app files: network first (always the newest version), cache when there is no signal
  e.respondWith(fetch(req).then(save).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("index.html"))));
});

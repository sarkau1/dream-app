// Lucent Dreaming service worker: makes the site installable as an app, keeps the built files on
// the phone so it opens fast, and shows offline.html when there's no connection.
//
// Pages always come from the network first, so every deploy reaches users on their next open;
// nothing here needs changing when the app changes. Bump VERSION only when this file's own
// logic changes: the browser installs the new worker and activate() clears the old caches.
const VERSION = 'v1'
const SHELL_CACHE = `shell-${VERSION}`
const ASSET_CACHE = `assets-${VERSION}`
// Built files are named by content hash, so each deploy adds new ones; keep the newest few.
const MAX_ASSETS = 80

const scoped = (path) => new URL(path, self.registration.scope).href
const OFFLINE_URL = scoped('offline.html')
const PRECACHE = [OFFLINE_URL, scoped('icon-192.png')]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function trimAssets() {
  const cache = await caches.open(ASSET_CACHE)
  const keys = await cache.keys()
  // Oldest first, in the order they were added.
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((key) => cache.delete(key)))
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE)
    await cache.put(request, response.clone())
    void trimAssets()
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Supabase and anything else off-site go straight to the network, never through a cache:
  // dreams and logins must always be live.
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }
  if (url.href.startsWith(scoped('assets/'))) {
    event.respondWith(cacheFirst(request))
  }
})

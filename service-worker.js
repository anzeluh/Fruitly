/**
 * FruitScan — service-worker.js
 * Caches app shell + model files for offline use
 */

const CACHE_NAME = 'fruitscan-v1';
const MODEL_CACHE = 'fruitscan-model-v1';

// App shell files to cache immediately
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Outfit:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js',
];

// Model files — cached separately so they can be updated independently
const MODEL_FILES = [
  './metadata.json',
  './model/model.json',
];

// ── INSTALL ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(e => console.warn('[SW] Shell cache partial fail:', e))),
      caches.open(MODEL_CACHE).then(cache => cache.addAll(MODEL_FILES).catch(e => console.warn('[SW] Model cache fail (expected if no model yet):', e))),
    ])
  );
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== MODEL_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome')) return;

  // Model files: cache-first
  if (url.pathname.includes('/model/') || url.pathname.endsWith('metadata.json')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetchAndCache(request, MODEL_CACHE))
    );
    return;
  }

  // TF.js CDN: cache-first
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('fonts.')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetchAndCache(request, CACHE_NAME))
    );
    return;
  }

  // App shell: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});

async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('Network error', { status: 408 });
  }
}

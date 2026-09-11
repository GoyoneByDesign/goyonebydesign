/* MAX-G offline shell. Bump VERSION when any shipped shell file changes.
 * Model tensors/config/tokenizers/WASM belong to WebLLM's IndexedDB cache.
 * This worker never caches searches, conversations, uploads or arbitrary pages.
 */
const VERSION = '2026-09-11.12';
const SCOPE = new URL(self.registration.scope);
const PREFIX = `maxg-pwa:${encodeURIComponent(SCOPE.pathname)}:`;
const SHELL_CACHE = `${PREFIX}shell:${VERSION}`;
const LIBRARY_CACHE = `${PREFIX}libraries:0.2.85`;
const WEBLLM_URL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm';
const SHELL_FILES = [
  './', './index.html', './style.css', './app.js', './state.js', './tools.js',
  './improvement.js', './improvement-ui.js', './improvement.css', './connectors.js', './connectors.css', './unit-data.js', './voice.js', './files.js', './engine.js', './inference-worker.js',
  './locations.js', './locations-ui.js', './locations.css', './companion-interactions.js', './performance.js', './performance-worker.js', './profile.js', './profile-ui.js', './profile.css', './orbit.js', './orbit.css',
  './voice-config.js', './neural-voice.js', './voice-worker.js', './voice-studio.js', './voice-studio.css', './assets/goyonebydesign-logo.png',
  './manifest.json', './assets/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png',
];
const VOICE_LIBRARY_CACHE=`${PREFIX}voice-libraries:1.2.1`;
const VOICE_LIBRARIES=new Set(['https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.mjs',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.wasm']);
const SHELL_URLS = new Set(SHELL_FILES.map(file => new URL(file, SCOPE).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    try {
      // addAll is atomic: an incomplete deployment cannot replace a working UI.
      await cache.addAll([...SHELL_URLS].map(url => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(SHELL_CACHE);
      throw error;
    }
    // Do not force a new version over an open conversation. It activates after
    // all older MAX-G tabs close (or an explicit app update message).
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== SHELL_CACHE && name !== LIBRARY_CACHE && name !== VOICE_LIBRARY_CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  // Same-origin page code asks for an update only after it has saved its work.
  if (event.data?.type === 'MAXG_ACTIVATE_UPDATE' && event.source?.url
      && new URL(event.source.url).origin === SCOPE.origin) self.skipWaiting();
});

async function staticResponse(request) {
  const cache = await caches.open(SHELL_CACHE);
  const saved = await cache.match(request.url);
  if (saved) return saved;
  // A missing entry may indicate storage eviction. Repair only known static URLs.
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque' && !response.redirected) {
    try { await cache.put(request.url, response.clone()); } catch { /* serve even when browser storage is full */ }
  }
  return response;
}

async function libraryResponse(request) {
  const cache = await caches.open(LIBRARY_CACHE);
  const saved = await cache.match(WEBLLM_URL);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok && ['basic', 'cors', 'default'].includes(response.type)
      && !response.redirected) {
    try { await cache.put(WEBLLM_URL, response.clone()); } catch { /* online inference can still run */ }
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (VOICE_LIBRARIES.has(url.href)) {
    event.respondWith((async()=>{const cache=await caches.open(VOICE_LIBRARY_CACHE);const hit=await cache.match(url.href);if(hit)return hit;const response=await fetch(request);if(response.ok&&response.type!=='opaque'&&!response.redirected)try{await cache.put(url.href,response.clone());}catch{}return response;})());return;
  }
  if (url.href === WEBLLM_URL) {
    event.respondWith(libraryResponse(request));
    return;
  }
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  // Only the two entry URLs are navigation fallbacks. Unknown paths keep their
  // real 404/network behavior; private query strings are never cache keys.
  const entry = url.pathname === SCOPE.pathname || url.pathname === new URL('./index.html', SCOPE).pathname;
  if (request.mode === 'navigate' && entry) {
    event.respondWith((async () => {
      const cached = await (await caches.open(SHELL_CACHE)).match(new URL('./index.html', SCOPE).href);
      if (cached) return cached;
      try { return await fetch(request); }
      catch { return new Response('MAX-G is offline and its app shell was removed by the browser. Reconnect once to restore it.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    })());
    return;
  }
  if (!url.search && SHELL_URLS.has(url.href)) event.respondWith(staticResponse(request));
});

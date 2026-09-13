/* MAX-G offline shell. Bump VERSION when any shipped shell file changes.
 * Model tensors/config/tokenizers/WASM belong to WebLLM's IndexedDB cache.
 * This worker never caches searches, conversations, uploads or arbitrary pages.
 */
const VERSION = '2026-09-13.14';
const RELEASE_VERSION = '1.11.0';
const RELEASE_BUILD = 206;
const SCOPE = new URL(self.registration.scope);
const PREFIX = `maxg-pwa:${encodeURIComponent(SCOPE.pathname)}:`;
const SHELL_CACHE = `${PREFIX}shell:${VERSION}`;
const LIBRARY_CACHE = `${PREFIX}libraries:0.2.85`;
const WEBLLM_URL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm';
const SHELL_FILES = [
  './request-understanding.js', './research.js', './research-routing.js', './research-cards.js', './research-cards.css',
  './mobile-viewport.js', './mobile-viewport.css', './IOS-INSTALL.md', './release-version.js', './updates.js', './updates.css', './install.html', './install.css', './install.js',
  './', './index.html', './launch-context.js', './style.css', './app.js', './activity-frame.js', './state.js', './tools.js', './units.js', './weather-card.js', './weather-place.js', './weather-card.css', './gemini.js', './answer-routing.js', './browser-task.js', './browser-panel.js', './browser-panel.css',
  './improvement.js', './improvement-ui.js', './improvement.css', './connectors.js', './connectors.css', './unit-data.js', './voice.js', './files.js', './engine.js', './local-ai.js', './extensions.js', './extensions.css', './inference-worker.js',
  './device.js', './device-ui.js', './device.css', './country-data.js', './postal-data.js', './locations.js', './locations-ui.js', './locations.css', './companion-interactions.js', './performance.js', './performance-worker.js', './music-composer.js', './song-vocals.js', './assets/song/male-syllables-v1.json', './profile.js', './profile-ui.js', './profile.css', './orbit.js', './orbit.css',
  './speech-text.js', './address-speech.js', './voice-config.js', './neural-voice.js', './voice-worker.js', './voice-studio.js', './voice-studio.css', './assets/goyonebydesign-logo.png',
  './manifest.json', './assets/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png',
];
const VOICE_LIBRARY_CACHE=`${PREFIX}voice-libraries:1.2.1`;
const VOICE_LIBRARIES=new Set(['https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.mjs',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.wasm']);
const SHELL_URLS = new Set(SHELL_FILES.map(file => new URL(file, SCOPE).href));
const RELEASE_URL = new URL('./release.json', SCOPE).href;
function integrityFor(hash) {
  if(!/^[a-f0-9]{64}$/.test(hash||''))throw Error('A shell asset is missing its release hash.');
  return 'sha256-'+btoa(String.fromCharCode(...hash.match(/../g).map(pair=>parseInt(pair,16))));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    try {
      // Pin every cached byte to the same release, even while a CDN is updating.
      const response = await fetch(new Request(new URL('./release.json', SCOPE), {cache:'no-store',credentials:'omit',redirect:'error'}));
      if (!response.ok) throw Error('The shared release manifest is unavailable.');
      const raw = await response.text();
      if (raw.length > 160000) throw Error('Release manifest is too large.');
      const release = JSON.parse(raw);
      if (release.schema !== 1 || release.version !== RELEASE_VERSION || release.build !== RELEASE_BUILD || !Array.isArray(release.files))
        throw Error('The shared release is still being published.');
      const hashes = new Map(release.files.map(file=>[file.path,file.sha256]));
      const requests = [...SHELL_URLS].map(url=>{
        const path = url===SCOPE.href?'index.html':url.slice(SCOPE.href.length);
        const hash=hashes.get(path);
        const integrity=integrityFor(hash);
        return new Request(url,{cache:'reload',credentials:'omit',redirect:'error',integrity});
      });
      await cache.addAll(requests);
      await cache.put(RELEASE_URL,new Response(raw,{headers:{'Content-Type':'application/json'}}));
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
  if (event.data?.type === 'MAXG_ACTIVATE_UPDATE' && event.source?.url) {
    const source=new URL(event.source.url);
    if(source.origin===SCOPE.origin&&source.pathname.startsWith(SCOPE.pathname))self.skipWaiting();
  }
});

async function staticResponse(request) {
  const cache = await caches.open(SHELL_CACHE);
  const saved = await cache.match(request.url);
  if (saved) return saved;
  // A repair must match this cache's release, not whichever release is now live.
  const manifest=await cache.match(RELEASE_URL);
  if(!manifest)return new Response('Reopen MAX-G online to restore its complete app cache.',{status:503});
  const release=await manifest.json();
  const path=request.url.slice(SCOPE.href.length)||'index.html';
  const integrity=integrityFor(release.files.find(file=>file.path===path)?.sha256);
  const response = await fetch(new Request(request,{integrity,cache:'reload',credentials:'omit',redirect:'error'}));
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

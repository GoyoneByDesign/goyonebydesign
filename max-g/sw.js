/* Legacy install-route migration. Personal IndexedDB and browser storage are preserved. */
const destination = url => {const next=new URL(url);next.pathname=next.pathname.replace(/^\/max-g(?:\/|$)/,'/max-alpha/');return next.href;};
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin===self.location.origin&&url.pathname.startsWith('/max-g/'))event.respondWith(Response.redirect(destination(event.request.url),302));});

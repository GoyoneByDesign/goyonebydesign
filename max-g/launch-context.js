/** Classic bootstrap: file previews cannot run MAX-G's module/PWA application. */
(() => {
  'use strict';
  const canonical = 'https://www.goyonebydesign.com/max-g/';
  const protocol = window.location.protocol;

  // Preserve the actual deployment path, including the Mac's loopback server.
  // This classic script is deferred, so the complete app DOM is already parsed.
  if (protocol === 'https:' || protocol === 'http:') {
    const app = document.createElement('script');
    app.type = 'module';
    app.src = new URL('./app.js', document.currentScript.src).href;
    document.head.append(app);
    return;
  }

  const notice = document.createElement('div');
  notice.id = 'launchContextNotice';
  notice.className = 'noscript-notice';
  const card = document.createElement('section');
  card.className = 'card';
  const heading = document.createElement('h1');
  heading.textContent = 'Open the working MAX-G app';
  const explanation = document.createElement('p');
  explanation.textContent = 'This is a preview of MAX-G’s source file. Chat, location, and saved settings need the installed Mac app or the secure website.';
  const status = document.createElement('p');
  status.id = 'launchContextStatus';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const link = document.createElement('a');
  link.className = 'button button-primary';
  link.href = canonical;
  link.rel = 'noreferrer';
  link.referrerPolicy = 'no-referrer';
  link.textContent = 'Open MAX-G online';
  const offline = document.createElement('p');
  offline.textContent = 'If you’re offline, open MAX-G from Applications on your Mac.';
  card.append(heading, explanation, status, link, offline);
  notice.append(card);
  const shell = document.querySelector('.app-shell');
  if (shell) shell.hidden = true;
  document.body.append(notice);

  // Never read or forward a local path, query, fragment, pairing key, or data URL.
  // Only a file preview gets an automatic public-site handoff.
  if (protocol !== 'file:') {
    status.textContent = 'Use the secure website or installed Mac app to continue.';
    return;
  }
  if (navigator.onLine === false) {
    status.textContent = 'You appear to be offline. The source-file preview cannot start MAX-G.';
    return;
  }

  status.textContent = 'Opening MAX-G’s secure website…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  fetch(canonical, {mode: 'no-cors', credentials: 'omit', cache: 'no-store',
    redirect: 'follow', referrerPolicy: 'no-referrer', signal: controller.signal})
    .then(() => window.location.replace(canonical))
    .catch(() => {
      status.textContent = 'I couldn’t reach MAX-G online. Check your connection and use the link below, or open the installed Mac app.';
    })
    .finally(() => clearTimeout(timeout));
})();

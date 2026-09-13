/** Website installation helper. Does not access chats, location or device permissions. */
export const APP_URL = 'https://www.goyonebydesign.com/max-g/';
export function installationPlatform(nav = globalThis.navigator) {
  const ua = String(nav?.userAgent || '');
  if (/iPad|iPhone|iPod/i.test(ua) || /Macintosh/i.test(ua) && Number(nav?.maxTouchPoints) > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}
export function installedDisplay(nav = globalThis.navigator, scope = globalThis) {
  return nav?.standalone === true || Boolean(scope.matchMedia?.('(display-mode: standalone)').matches) || Boolean(scope.matchMedia?.('(display-mode: window-controls-overlay)').matches);
}
export function mountInstallPage(doc = globalThis.document, scope = globalThis) {
  if (!doc?.getElementById('installation')) return null;
  const nav = scope.navigator;
  const byId = id => doc.getElementById(id);
  let deferredPrompt = null;
  let installed = installedDisplay(nav, scope);
  let prompting = false;
  const platforms = ['ios', 'android', 'desktop'];
  const choose = platform => {
    if (!platforms.includes(platform)) return;
    doc.querySelectorAll('[data-platform]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.platform === platform)));
    platforms.forEach(name => { byId(`platform-${name}`).hidden = name !== platform; });
  };
  const renderInstalled = () => {
    byId('installedStatus').hidden = !installed;
    byId('installApp').hidden = installed || !deferredPrompt;
    byId('showSteps').textContent = installed ? 'Install on another device ↓' : 'See installation steps ↓';
  };
  choose(installationPlatform(nav));
  renderInstalled();
  doc.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => choose(button.dataset.platform)));
  const beforeInstall = event => {
    event.preventDefault();
    if (installed) return;
    deferredPrompt = event;
    renderInstalled();
  };
  const afterInstall = () => {
    installed = true;
    deferredPrompt = null;
    byId('installStatus').textContent = 'MAX-G was installed. Open its icon from your device’s apps or Home Screen.';
    // Installation in a separate window does not turn this browser tab into an installed window.
    byId('installedStatus').textContent = 'MAX-G is installed on this device.';
    renderInstalled();
  };
  scope.addEventListener('beforeinstallprompt', beforeInstall);
  scope.addEventListener('appinstalled', afterInstall);
  byId('installApp').addEventListener('click', async () => {
    if (!deferredPrompt || prompting || installed) return;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    prompting = true;
    byId('installApp').disabled = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (!installed) byId('installStatus').textContent = choice?.outcome === 'accepted'
        ? 'Your browser accepted the installation request. Finish any device prompts, then look for the MAX-G icon.'
        : 'Installation canceled. You can keep using MAX-G in your browser or follow the steps below.';
    } catch {
      if (!installed) byId('installStatus').textContent = 'The browser could not open installation. Follow the steps below, or open MAX-G in your browser.';
    } finally {
      prompting = false;
      byId('installApp').disabled = false;
      renderInstalled();
    }
  });
  byId('copyLink').addEventListener('click', async () => {
    try {
      if (!nav?.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await nav.clipboard.writeText(APP_URL);
      byId('copyStatus').textContent = 'Link copied. Paste it into Safari on your iPhone or iPad.';
    } catch {
      const address = byId('appAddress');
      address.focus();
      address.select();
      address.setSelectionRange(0, APP_URL.length);
      byId('copyStatus').textContent = 'The link is selected. Use your device’s Copy command, then paste it into Safari.';
    }
  });
  const shareData = { title: 'MAX-G', text: 'Open MAX-G, your personal companion from GoyoneByDesign.', url: APP_URL };
  byId('shareLink').hidden = typeof nav?.share !== 'function';
  byId('shareLink').addEventListener('click', async () => {
    try { await nav.share(shareData); }
    catch (error) { if (error?.name !== 'AbortError') byId('copyStatus').textContent = 'Sharing isn’t available here. Use Copy link instead.'; }
  });
  return { choose, isInstalled: () => installed, destroy() { scope.removeEventListener('beforeinstallprompt', beforeInstall); scope.removeEventListener('appinstalled', afterInstall); } };
}
if (typeof document !== 'undefined') mountInstallPage();

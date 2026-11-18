// Isolated end-to-end acceptance against the real app and IndexedDB.
// No user profile, model, provider call, personal backup or service worker is used.
// Serve the repository at http://127.0.0.1:8791 and use an installed Playwright.
// Native quota exhaustion, physical devices and offline inference remain separate gates.
const assert = require('node:assert/strict');
const {mkdtempSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
const evidenceDirectory = mkdtempSync(join(tmpdir(), 'max-alpha-backup-acceptance-'));
const {chromium} = require(process.env.MAX_ALPHA_PLAYWRIGHT_PATH || 'playwright');
const origin = 'http://127.0.0.1:8791';
const results = [];
async function ready(page) {
  await page.goto(origin + '/max-alpha/');
  await page.locator('body[data-maxg-ready="true"]').waitFor({state: 'attached'});
}
async function saved(page) {
  return page.evaluate(async () => (await import('./state.js')).loadState());
}
async function seed(page) {
  await ready(page);
  await page.evaluate(async () => {
    const {freshState, saveState} = await import('./state.js');
    const state = freshState();
    state.settings.permissions.files = 'allow';
    state.settings.permissions.internet = 'deny';
    state.settings.permissions.microphone = 'deny';
    state.settings.speak = false;
    state.settings.hourlyLearning = false;
    state.study.nextRun = 8000000000000000;
    await saveState(state);
  });
  await ready(page);
}
async function restoreDialog(page, source) {
  await page.locator('#quickCheckUpdatesBtn').click();
  await page.locator('[data-tab="memory"]').click();
  await page.getByRole('button', {name: 'Restore personal backup', exact: true}).click();
  const dialog = page.locator('dialog').filter({has: page.getByRole('heading', {name: 'Restore personal data', exact: true})});
  await dialog.getByLabel('Personal backup JSON file').setInputFiles({
    name: 'synthetic-backup.json', mimeType: 'application/json',
    buffer: Buffer.from(typeof source === 'string' ? source : JSON.stringify(source))
  });
  return dialog;
}
async function preview(dialog) {
  await dialog.getByRole('button', {name: 'Preview backup', exact: true}).click();
  await dialog.locator('[role="status"]').filter({hasNotText: 'Reading local backup'}).waitFor();
}
async function confirm(dialog) {
  await dialog.getByRole('button', {name: 'Confirm restore', exact: true}).click();
  await dialog.locator('[role="status"]').filter({hasNotText: 'Saving personal data locally'}).waitFor();
}
async function closeDialog(page, dialog, name = 'Cancel') {
  await dialog.getByRole('button', {name, exact: true}).click();
  await dialog.waitFor({state: 'detached'});
  await page.locator('#closeSettingsBtn').click();
}
(async () => {
  const browser = await chromium.launch({headless: true, chromiumSandbox: true,
    executablePath: process.env.MAX_ALPHA_BROWSER_EXECUTABLE});
  try {
    for (const width of [1365, 393]) {
      const context = await browser.newContext({viewport: {width, height: 900}, serviceWorkers: 'block'});
      const blocked = [], errors = [];
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        blocked.push(url.origin); return route.abort();
      });
      try {
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        await seed(page);
        const initial = await saved(page), source = structuredClone(initial);
        source.notes.push({id: 'synthetic-restore-note', title: 'Synthetic acceptance note',
          text: 'Local test fixture only.', source: 'Synthetic fixture', enabled: true, kind: 'manual', time: 1});

        // Preview must not save. Cancel and Escape both leave persistent state untouched.
        let dialog = await restoreDialog(page, source);
        await preview(dialog);
        assert.equal(await dialog.getByRole('button', {name: 'Confirm restore', exact: true}).isEnabled(), true);
        assert.deepEqual(await saved(page), initial);
        const box = await dialog.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1, 'dialog fits viewport');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({path: join(evidenceDirectory, `restore-preview-${width}.png`), fullPage: true});
        await closeDialog(page, dialog);
        dialog = await restoreDialog(page, source); await preview(dialog);
        await page.keyboard.press('Escape'); await dialog.waitFor({state: 'detached'});
        assert.deepEqual(await saved(page), initial);
        await page.locator('#closeSettingsBtn').click();

        // A second real page writes the same native IndexedDB after preview.
        dialog = await restoreDialog(page, source); await preview(dialog);
        const other = await context.newPage(); await ready(other);
        await other.evaluate(async () => {
          const {loadState, saveState} = await import('./state.js');
          const state = await loadState(); state.profile.about = 'Synthetic second-window edit'; await saveState(state);
        });
        const newer = await saved(other);
        await confirm(dialog);
        assert.match(await dialog.locator('[role="status"]').innerText(), /changed after preview/);
        assert.deepEqual(await saved(page), newer);
        await closeDialog(page, dialog);
        // This stale first page cannot use a newer on-disk state as its baseline.
        dialog = await restoreDialog(page, source); await preview(dialog);
        assert.match(await dialog.locator('[role="status"]').innerText(), /Saved data differs/);
        assert.equal(await dialog.getByRole('button', {name: 'Confirm restore', exact: true}).isDisabled(), true);
        await closeDialog(page, dialog); await other.close();

        await seed(page);
        const beforeAbort = await saved(page);
        dialog = await restoreDialog(page, source); await preview(dialog);
        // Abort the genuine IndexedDB transaction at put. This is not quota exhaustion.
        await page.evaluate(() => {
          const original = IDBObjectStore.prototype.put;
          IDBObjectStore.prototype.put = function(value, key) {
            IDBObjectStore.prototype.put = original;
            if (this.name === 'state' && key === 'personal') { this.transaction.abort(); return; }
            return original.apply(this, arguments);
          };
        });
        await confirm(dialog);
        assert.equal(await dialog.getByRole('button', {name: 'Confirm restore', exact: true}).isDisabled(), true);
        assert.doesNotMatch(await dialog.locator('[role="status"]').innerText(), /restored and saved/);
        assert.deepEqual(await saved(page), beforeAbort);
        await closeDialog(page, dialog);

        // Failed confirmation can be retried only after a fresh preview.
        dialog = await restoreDialog(page, source); await preview(dialog); await confirm(dialog);
        assert.match(await dialog.locator('[role="status"]').innerText(), /restored and saved/);
        const restored = await saved(page);
        assert.equal(restored.notes.length, 1); assert.equal(restored.notes[0].enabled, false);
        assert.deepEqual(restored.settings, beforeAbort.settings);
        assert.equal(await dialog.getByRole('button', {name: 'Confirm restore', exact: true}).isDisabled(), true);
        await closeDialog(page, dialog, 'Done'); await ready(page);
        assert.deepEqual(await saved(page), restored);
        dialog = await restoreDialog(page, source); await preview(dialog);
        assert.match(await dialog.locator('[role="status"]').innerText(), /adds no new records/);
        assert.equal(await dialog.getByRole('button', {name: 'Confirm restore', exact: true}).isDisabled(), true);
        await closeDialog(page, dialog);

        dialog = await restoreDialog(page, '{broken'); await preview(dialog);
        assert.match(await dialog.locator('[role="status"]').innerText(), /not a valid JSON/);
        assert.equal(await dialog.getByRole('button', {name: 'Confirm restore', exact: true}).isDisabled(), true);
        assert.deepEqual(await saved(page), restored);
        await closeDialog(page, dialog);
        assert.deepEqual(errors, []);
        results.push({width, previewNoWrite: true, cancelAndEscape: true,
          nativeIndexedDBAbort: true, crossWindowBeforeAndAfterPreview: true,
          retryAndReloadPersistence: true, idempotency: true, malformedFile: true,
          pausedImportedNote: true, settingsPreserved: true, noHorizontalOverflow: true,
          externalRequestsBlocked: blocked.length, pageErrors: errors});
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
  console.log(JSON.stringify({passed: true, evidenceDirectory, results, remainingGates: [
    'Actual storage quota exhaustion', 'Physical-device acceptance', 'Offline inference readiness',
    'Visual review of screenshots', 'Real service-worker update installation'
  ]}, null, 2));
})().catch(error => {console.error(error); process.exitCode = 1;});

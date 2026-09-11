# MAX-G 1.1 — connector verification

This is the version 1.1 baseline. The shopping release adds checks to the current
suites; see [SHOPPING-VERIFICATION.md](SHOPPING-VERIFICATION.md) for version 1.2.

Tested on September 11, 2026, on this Intel Mac. The original PWA and preserved
desktop source remain in the package. No account sign-in, message delivery, call,
app shutdown, computer restart or disk reset was performed during these checks.

## Results

| Check | Executed result |
| --- | --- |
| JavaScript runtime, state, tools, voice, exports, service worker, connectors and real Cloudflare HTMLRewriter | **97 passed**, no skips with local Miniflare enabled |
| Python OAuth/Keychain fixtures, provider adapters, native adapters, permission policy and HTTP server | **96 passed**, including two real isolated Playwright form tests |
| New Connectors UI against the actual companion HTTP server | **55 checks passed**, zero uncaught JavaScript errors |
| Existing desktop/mobile PWA UI regression | **44 checks passed**, zero uncaught JavaScript errors |
| Delayed and failed storage writes, durable saves and factory reset regression | **14 checks passed**, zero uncaught JavaScript errors |
| Production companion startup on this Mac | Started successfully using its own Keychain namespace; authenticated status worked; private files were not served |
| Production companion shutdown | Exited cleanly and removed the temporary pairing key |
| Fixed native JXA scripts | All six compiled successfully with macOS `osacompile`; native actions were not executed |
| Original desktop source archive | SHA-256 unchanged: `55313fe906036763841733212338cc155151d60b858cf483588172fcb9461f29` |

The companion's local environment was installed successfully with Python 3.14
and pinned Playwright 1.62.0. `Start MAX-G Companion.command` is ready in this
working folder. An extracted copy of the ZIP needs its setup launcher once.

## What the tests actually cover

The connector UI checks use the real HTML, CSS, `app.js`, `connectors.js`, HTTP
server, action previews and policy enforcement. External accounts, native device
actions, browser-adapter replies, model text and speech are explicit test fixtures.
Separate Playwright integration tests interact with real synthetic form pages.
They do not log into or submit forms on third-party services.

Checks include:

- Custom-port pairing, removal of the URL fragment, session-only pairing storage,
  and absence of pairing tokens from personal IndexedDB state.
- OAuth client configuration and provider sign-in links, without following a
  sign-in or pretending that a fixture account is a real connected account.
- Ask/Allow/Deny behavior, immutable single-use approvals, expiry, cancellation,
  and invalidation when permissions, account configuration or reset changes.
- Forced review for sends, mail cleanup, app closing, calling, browser/desktop
  presses and power actions, including under the Full preset.
- Mail readers, professional/casual rewriting through the app's local-model
  callback, attachment names/removal/bytes, and complete recipient/body previews.
- Two-megabyte/six-file email attachment limits and eight-megabyte file transfers.
  Cancelling a pending file read prevents later helper dispatch.
- Cloud file download/upload, browser observation revisions, changed-form
  rejection, CAPTCHA/MFA handoff and a bounded reviewed model-proposal loop.
- Enter-to-send, Shift+Enter, mobile overflow/dialog sizing, preserved voice
  settings, source and Office exports, notes, skills and reset controls.

The production startup smoke used only MAX-G's own Keychain configuration reads.
The OAuth/Keychain tests used injected stores/subprocesses: there was no actual
credential write, refresh or revocation, and no live provider API send/upload.
Native permissions, real email delivery, Messages forwarding, calling and display
brightness still require a device/account check after you connect them.

The original real WebLLM/GPU and offline measurements remain in
[VERIFICATION.md](VERIFICATION.md). The inference engine was preserved; the new
connector rewrite tests use a model fixture and do not establish the quality or
latency of a particular generated email.

## Reproduce the automated checks

From the `max-g-web` folder:

```sh
bash 'Setup MAX-G Companion.command'
npm test
MAXG_BROWSER_INTEGRATION=1 companion/.venv/bin/python -m unittest discover -s companion/tests -p 'test_*.py'
```

At the version 1.1 baseline, the JavaScript run passed 96 checks and skipped the optional real Worker
runtime test. To include it, install Miniflare in an ignored scratch directory:

```sh
npm install --prefix work/worker-tests miniflare
MAXG_MINIFLARE_MODULE="$PWD/work/worker-tests/node_modules/miniflare/dist/src/index.js" npm test
```

This uses a local Cloudflare test runtime; it does not deploy or create a paid
service. The Node runtime required by Miniflare may be newer than the PWA itself.
Python tests without `MAXG_BROWSER_INTEGRATION=1` skip the two browser fixtures.

Machine-readable UI receipts are included in `verification/`. They contain test
results, not personal account credentials. The development browser/server profiles
and virtual environment are excluded from the release ZIP.

## Account and device setup

Follow [CONNECTORS.md](CONNECTORS.md), then [PROVIDER-SETUP.md](PROVIDER-SETUP.md)
for OAuth registration or [NATIVE-SETUP.md](NATIVE-SETUP.md) for existing Apple Mail,
Spotify, Messages, calling and macOS permissions. GitHub Pages, DNS and Cloudflare
deployment remain documented in [DEPLOYMENT.md](DEPLOYMENT.md); no production
hosting changes were made in this release.

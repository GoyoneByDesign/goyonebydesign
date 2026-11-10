# November 4, 2026 — MAX-ALPHA backup restore review source

Candidate 1.16.13/build234, prepared 2026-11-04T13:38:00Z (8:38 AM EST), adds non-destructive personal-record restore with strict validation, explicit preview/confirmation and atomic saved-state comparison. Existing complete export, records, settings, credentials and permissions are preserved; imported knowledge and schedules are paused. 127 Node tests (48 focused recovery checks), syntax and release-integrity checks pass; DOM/storage doubles are not real browser acceptance. Chromium launch is blocked by the cloud sandbox/environment. Do not merge/deploy until browser reload, failed writes, cross-tab and cancellation acceptance pass. Live1.16.12/build233 and all existing installers remain unchanged. See max-alpha/DEVICE-GUIDE.md for recovery limits and independent/offline acceptance. Review branch publication is verified separately.


This review does not change the live website or any installer. Before deployment, run actual-browser acceptance for file selection, Cancel/Escape, repeated confirmation, failed storage writes, reload persistence, and two-window interference. Keep the existing complete personal export private. See DEVICE-GUIDE.md for supported fields and excluded runtime/preferences.


## November 10, 2026 — reproducible browser acceptance runner

Revalidated the unchanged candidate on Node 24.22.1: 127 MAX-ALPHA tests, three
portal-history tests, JavaScript syntax, the 106-file manifest and catalog checks
passed. Live version 1.16.12/build 233, candidate version 1.16.13/build 234 and all
app runtime files remain unchanged. No new app release is implied.

Added `tests/backup-acceptance.browser.cjs` for isolated desktop (1365px) and mobile
(393px) viewport checks. It drives the real app and native IndexedDB using only
synthetic records: preview without writes; Cancel/Escape; a second page's writes
before/after preview; abort of a genuine write transaction; retry; persistence
through reload; repeated backup idempotency; malformed JSON; preserved settings;
paused imported notes; and overflow checks. It captures preview screenshots in a
new temporary directory and blocks all non-local requests and service workers.

Run from the repository root in two terminals, using an already installed
Playwright package and Chromium executable:

```sh
python3 -m http.server 8791 --bind 127.0.0.1
MAX_ALPHA_PLAYWRIGHT_PATH=/path/to/playwright MAX_ALPHA_BROWSER_EXECUTABLE=/path/to/chromium node max-alpha/tests/backup-acceptance.browser.cjs
```

The new runner is syntax-checked, **not browser-executed or validated**. Both normal
and permitted elevated Chromium launch attempts stopped before a page opened:
`socket() failed: Operation not permitted`. Do not report the runner's scenarios
as passing or use the Node mocks as a substitute. The injected native transaction
abort is also not actual storage quota exhaustion. Real quota failure, visual
screenshot review, physical devices, offline model readiness and a real
service-worker update lifecycle remain separate acceptance checks.

Keep PR #3 draft and unmerged. Do not deploy until required acceptance passes.
The separate existing public portal privacy hold is unchanged. This source-only
verification update publishes no personal data and changes no app behavior.

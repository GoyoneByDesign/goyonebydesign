# Connectivity and updates — October 13, 2026

This is an incremental implementation and inventory, not a claim that all apps were upgraded. The new `update-check.mjs` is a tested integration foundation; **no shipped app imports it yet**. There is no configured production manifest key or release endpoint, and no new installer, deployed page, provider activation, account, message, call or permission change.

## Verified scope and source reconciliation

GitHub inventory returned eight owner-admin repositories, seven application repositories plus the website. Website catalog has nine apps. Source histories, branches and archives must be reconciled individually; a catalog card is not evidence of a deployed runtime.

| App | Verified platform and source | Existing update coverage / remaining blocker |
| --- | --- | --- |
| StatusPing | React/TypeScript, Capacitor Android. `StatusPing` main `3a7699acface66e5c045c9d822c7feed264c6533`; review branch `c2adc18e267214f599bf50daa19ad66f49ec98dc` (0.1.1). Published 0.2.0-review.3/build5 is newer. | Preserve published source. Library contains `StatusPing-0.2.0-review-bundle.zip`; exact build5 correspondence still needs verification. Source retrieval blocked in this environment. No native update checker integrated. |
| JustMyPick | Native Android/Java plus Python mail backend, repository `SAVVYKIN`, main `9aa575da76fa65d19fb2d699688274fa31935932`. Older source ZIP actually exists despite obsolete bootstrap handoff. | Library has build38 corrected source. Current APK certificate `47e2395cbc7ccdb06fd98e9ff4cfd70c4fef94748b57c2ad8ee7502f781c7e03` differs from old 0.36 certificate `b2213386d6a0d581a8a073a90a3f456f3cd09177ea77ad1d09614178c6179aab`. Original key needed for old installations. No updater integrated. |
| VIEW4REAL | React/TypeScript + Tauri/Rust, repository `SightSync` main `e15818bc76d07d177a0f7488a5e0867f87b5afef`. Published 0.2.2 Windows x64 ZIP is newer than remote source. | Library corrected 0.2.2 source SHA256 `26971a8ed24a64e83b5ad0d5dbe48c61eec01ef170f1fd564609345eb1f66781`. Published EXE is Authenticode NotSigned. Reconcile source, configure signed native updater/package distribution and verify hardware before release. |
| MAX-ALPHA | Website `/max-alpha/` browser/PWA 1.16.2/build223. Standalone main `5b2d94292fbf07be0ac7ce68cb293d3c987f725d`; separate `security/disable-browser-provider-keys` branch. | Existing manual checker and foreground checks, deferred activation and SHA256 shell integrity. Existing manifest is unsigned; integrity is not independent authenticity. Keep website and standalone copies separate; reconcile security branch before runtime changes. New signed foundation is not wired into either. |
| MAX-ZETA | `/pmix/` redirects to owner-private Sites deployment; catalog 3.61.0/build84. Website contains older `pmix-app/` source. | Existing private deployment must be inspected through Sites and updated there. Public redirect/source is not the authoritative running app. No runtime change. |
| BOARDROOM | `/boardroom/` redirects to owner-private Sites deployment; catalog Web v2. No dedicated repository in verified inventory. | Sites owns runtime/version history. No runtime change or private access expansion. |
| StockPilot | Self-hosted Node/SQLite web app. Main `7a5afa25b578067d8b16f0058946749671900b29`; newer `dot/stockpilot-foundations-2026-10-08` branch. | Reconcile work branch before changes. Server software update cannot safely replace a running process or migrate operational database through a browser button. Opt-in metadata checks can be added after branch reconciliation; owner-controlled deploy remains required. |
| Questrix | React/TypeScript + Express/Vite/Firebase, main `056ec5db8243e812f1e9c5514d4eb7a3524d2d74`. AI Studio catalog link. | Verify actual hosted build and data persistence before frontend update prompts. No native installer or updater integrated. |
| The Commissary | React/TypeScript + Express/Vite browser prototype, main `b857640fb4225dfbda976bc492a988e7ca63191c`. Android files are preview source specifications. | No packaged Android application or verified hosted production deployment. No updater integrated. |

Website baseline is `f25cfd2a423938663b0bde11f2334241f047b22c`. Isolated review branch preserves main and all older installers. Local read-only clones of StatusPing, StockPilot and SAVVYKIN are retained separately. No reset, merge, force push or signing-key change occurred.

## Wi-Fi communication decision

Android phone/message drafts hand control to the system phone or messages app; they cannot force Wi-Fi transport, bypass carrier settings, or prove delivery. Carrier Wi-Fi Calling requires supported hardware, carrier and plan. Provider-mediated SMS or calls to ordinary phone numbers need a separately approved backend/provider, recipient consent, authenticated access, configuration, possible fees, rate limits, deduplication and verified delivery states. App-to-app internet messaging/VoIP is a different product requiring caregiver accounts and infrastructure. None is an emergency service or guaranteed alert route.

`wifiCommunicationStatus` provides tested offline/unconfigured paths with `canSend:false` and `canCall:false`. Integrate only after latest StatusPing source is available; do not relabel dialer/SMS drafts as internet delivery. The owner must choose carrier handoff, provider-mediated ordinary-number communication or app-to-app communication before live integration. No provider signup or cost has been authorized.

## Update foundation contract

- Caller pins an independently trusted **public** P-256 release key and exact HTTPS origins; never load a key from the same untrusted manifest. No private key is committed or provisioned.
- Explicit persistent user opt-in must call `setEnabled(true)`; default is disabled. Offline, busy and missing configuration paths do not fetch. Turning checks off invalidates in-flight results. Network failures and timeouts return an error, never success.
- Metadata envelope: `{schema:1,payload:<exact JSON string>,signature:<base64 64-byte ECDSA P-256/SHA256 signature>}`. Signature covers the exact UTF-8 payload bytes. Payload includes schema, app, platform, channel, signingIdentity, integer build, display version, issuedAt/expiresAt in milliseconds, plain-text notes, HTTPS package URL, byte length and SHA256. Maximum lifetime 31 days; bounded metadata read 64KB, payload 32KB, package limit 200MB. Credential/query-bearing URLs and redirects are rejected.
- Match installed app/platform/channel/signing identity, reject older builds, expose notes for a newer authenticated release. Hosts must render notes with textContent, save work, and wait for user installation approval. Do not execute remote scripts or manifest commands.
- `verifyPackageBytes` checks downloaded package size and digest. This is not an OS signature verifier. Native host must verify actual package identity/certificate, compatible signing lineage and increasing OS version code before offering installation. No download/install implementation is supplied here.
- Android Play-distributed builds use Play updates. Direct APK distribution requires original signing compatibility and OS-confirmed installation; do not request silent-install privileges. Windows Tauri updater requires mandatory update signatures and native integration; current unsigned portable ZIP is not a signed automatic update. Native iOS requires Apple-supported distribution/Mac tooling. PWAs must retain unsaved work and offline caches; browser HTTPS authentication alone is not independent release signing.
- Local checks, contacts, records and backups must remain intact. No uninstall, cache/data deletion, operational database migration, permissions change, background task interruption or fake delivery/update result.

## Evidence and remaining checks

`node --test scripts/test-update-check.mjs`: 12 focused tests passed using synthetic packages and ephemeral in-memory test keys. Covers no-network gates, valid signature, tampering/forgery, app/platform/channel/certificate mismatch, unsafe URLs, expiry/clock/integrity validation, rollback, HTTP/malformed/oversize failures, in-flight disable/busy protection, timeout/retry, package digest/size and unavailable Wi-Fi communication paths. No real sender/recipient or production key exists in tests.

Existing website checks also passed: catalog/assets/routes validation (nine cards, three preserved installer records), five catalog UI simulations and four portfolio simulations. Module JavaScript syntax and Git whitespace validation passed. No existing runtime, redirect, download or manifest bytes changed. Browser/device UI checks are not claimed for this unwired module.

Library search and handoff read succeeded. Required source-download helper failed first on sandbox DNS, then with network access on `Library prepare_materialize is not available`. No archives were retrieved or older runtime source edited. Continue source retrieval in an environment supporting the official Library materializer; verify archive hashes/build receipts before integration. This is an environment blocker, not an automatic approval rejection.

No new native builds, physical-device checks, full 12-hour/Doze/reboot tests, installed-app signing comparisons, caregiver delivery tests, live provider tests or iOS builds ran. Existing published StatusPing 155 tests and delayed emulator reminder evidence remain historical; they do not validate this module in the app.

## Official references checked

- [Android common intents](https://developer.android.com/guide/components/intents-common): phone/message handoffs.
- [Google carrier Wi-Fi Calling](https://support.google.com/phoneapp/answer/2811843): carrier/device availability.
- [Twilio Voice JavaScript SDK](https://www.twilio.com/docs/voice/sdks/javascript) and [provider pricing](https://www.twilio.com/en-us/pricing): internet-to-phone provider route, separate usage charges.
- [Android in-app updates](https://developer.android.com/guide/playcore/in-app-updates) and [app signing](https://developer.android.com/studio/publish/app-signing): supported update flow and signing compatibility.
- [Tauri updater](https://v2.tauri.app/plugin/updater/): mandatory signed update artifacts.
- [Apple distribution requirements](https://developer.apple.com/app-store/review/guidelines/#software-requirements), [Windows App Installer updates](https://learn.microsoft.com/en-us/windows/msix/app-installer/update-settings), [PWA update lifecycle](https://web.dev/learn/pwa/update): platform-specific integration.

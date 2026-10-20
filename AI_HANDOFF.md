## October 20, 2026 — StockPilot review-source listing preparation history

Recorded at 6:33:10 AM EDT (America/New_York). Added StockPilot 1.0.4-review.2/build 5 to the visible portal history after private source publication in draft PR 1 at 6:31:09 AM EDT. Commit f4f37f66c6b9e7434a87468f9b469e2efd6e5156 contains offline single-SKU fixed-price listing preparation and a disabled Sandbox-only lifecycle contract. The source suite passed 386 local Node tests, including 21 new synthetic tests; CLI smoke, syntax and whitespace checks passed. No live or Sandbox provider acceptance, dashboard writer, store write, merge or deployment occurred. Existing Workers/hosted/Chrome suites were not rerun; no commercial-readiness claim is made. Existing source history, including today's VIEW4REAL entry, and all catalog/download records are preserved. Portal history generator/tests and prior-entry preservation checks pass; this is a prepared portal edit until the publishing task verifies the exact commit and served Pages bytes.

## October 20, 2026 — VIEW4REAL source-only 0.2.4 / build 4

Added visible history for the private app source commit 84d58ff3fe5d61f0747e7b78bfde2ada7f0078dc (codex/import-ordering-20261020). Delayed reader/profile imports no longer overwrite newer edits, presets or privacy clearing. Source tests20, optical42, solver24 and simulated integration25 pass; TypeScript/frontend build pass. Seven real-browser regression cases exist but browser launch was blocked; no Windows/device testing or new installer. Existing 0.2.3/build3 downloads and catalog are unchanged. The history generator/tests validate this portal-only change; all previous entries are preserved. Verify Pages deployment and served bytes before claiming website publication.

## October 17, 2026 — StockPilot tested-source history sync

Added StockPilot 1.0.3/build3 to the portal's visible update history to match its local package/release metadata and history page. It describes the Windows SQLite shutdown repair as tested source only, not a new installer or hosted backend. The prior entries and public app catalog remain intact. The history generator validated all 12 applications; its three timezone/escaping/history tests passed, and the public catalog check passed with nine preview-only cards and three preserved installer records. No browser/device, live eBay, supplier, or backend deployment test ran for this portal change. Verify GitHub push and served Pages history before claiming publication.

## October 16, 2026 - View4Real 0.2.3 / build 2 Windows download

Prepared publication October 16, 2026 at 4:38:12 PM EDT. Download mirrored locally under downloads/releases/view4real/windows/0.2.3-build2/ and on the public GitHub release view4real-0.2.3-build2. Private application source is commit 32dd148bc248d1ffaef00aab50585505028903a4 on codex/update-history-20261015 in View4Real; default main remains the older baseline. Version/build, source and publication times, descriptions, test results, package bytes/hash and existing release history are preserved. 16 source tests, 42 optical-model checks, 24 solver checks, 25 integration checks, 7 Rust tests, 20 browser interaction checks and 12 history viewport checks passed. Native Windows checks: Copied-folder launch with isolated WebView2 profile; Visible 0.2.3 / Build 2 identity; Large print changed reader to 30 px; Bundled history rendered current and older entries with Eastern time; Clean requested close confirmed by process exit. Brightness hardware and billing remain unverified; experimental optical checks are not evidence of clinical benefit. Prior public downloads remain intact. Verify GitHub Pages and both served ZIP hashes before reporting publication.

# October 16, 2026 - Verified icon publication follow-up

2026-10-16T12:02:11Z. See apps/ICON-OUTCOME-2026-10-16.md and apps/ICON-LIVE-2026-10-16.json for published URLs, actual live PNG sizes/hashes, private preview outcomes and limitations. Source fixes are pushed. Existing installers unchanged. No physical iOS device testing.

# October 16, 2026 - Safari Home Screen icon maintenance

2026-10-16T11:32:36Z. Portfolio 1.0.1/build2; MAX-ALPHA website 1.16.6/build227. Added Apple icons from existing verified artwork on root/gallery/install/product/redirect routes. Preserved redirect targets and private access. VIEW4REAL PNGs are direct rasterizations of assets/view4real/view4real-icon.svg. MAX-ALPHA retains its existing real 180px PNG, manifest /max-g/ identity, update opt-in and storage. Only shell cache version advances under the existing guarded update mechanism; no storage clearing or migration. App-source-only fixes are separately labeled in portal history. MAX-ZETA current source unavailable in this Sites connection (project not found); stale pmix-app/ untouched. No native packages or third-party sites changed. Run the existing source checks and verify deployed bytes before claiming publication.

# goyonebydesign — AI handoff

## Storage maintenance — October 15, 2026, 6:07 PM EDT

Added STORAGE-RETENTION.md for all apps and linked it from AGENTS.md. This is documentation and cloud artifact maintenance; app versions/builds and deployable files are unchanged. Removed ten superseded completed Pages workflow artifacts (715,476,961 bytes); retained the two most recent successful Pages artifacts. Across the accessible app repositories, 32 obsolete workflow artifacts (841,514,086 bytes) were removed, retaining 13 artifacts including all device-test evidence. Source, Git history, public release assets, downloads and Commissary forms were preserved. The existing release-cleanup dry run found zero eligible tracked release files.

Verification: deletion returned HTTP204 and artifact-list readback confirmed removed IDs absent and all retained IDs present. Portal root/apps and five public installer/APK/ZIP endpoints returned HTTP200 afterward; both Toast sites also returned HTTP200. Private Drive cleanup receipts are stored privately with the Toast project, not in this public repository. No device/runtime test was rerun for this maintenance.

## October 15, 2026 - MAX-ALPHA device readiness

Release text now has explicit LF checkout rules in .gitattributes. Windows CRLF conversion otherwise produces locally valid hashes that differ from published Git blobs; the release manifest is regenerated from normalized bytes and must also be verified against the staged/archive bytes before push.

Added Settings > Extensions > Check this device to the existing website app, v1.16.4/build225. It detects browser API support for local AI, voice input/output and selected files, and explains Mac companion and protected cloud setup requirements. Checks do not request permissions, access storage, connect accounts, load models or make network requests. Browser support is explicitly distinguished from operational verification. Preserved update opt-in, provider input guards, personal records, app routes and the independent standalone repository baseline.

Verification: 22/22 Node tests including complete release hashes; catalog checks pass. Isolated Chromium checks at 1365px and 393px verify six cards, repeat checking, no horizontal overflow and no page errors; existing update-settings browser checks pass at both sizes. External requests were blocked in UI tests. No live inference or native-device verification. Release includes device-readiness.js in the offline shell and manifest.

Rollback: a separate source-revert rehearsal reproduced the exact pre-update 7c28000 tree. For installed clients, publish a forward rollback with the previous app behavior and a version/build greater than 1.16.4/build225 (prepared candidate: 1.16.5/build226), retaining LF release rules and regenerating the manifest. The update guard correctly refuses a lower build; a plain source revert is not sufficient for installed-client rollback. Run npm --prefix max-alpha test and node scripts/check-apps.mjs, inspect the intended diff, then push normally. Never reset/force-push or replace unrelated work. Existing MAX-ZETA/PMIX source and private redirects were not edited because coordination with the separate reporting task is outstanding. See apps/READINESS-2026-10-15.md for inventory and priorities. Publication must be verified from live bytes after push.

## October 13, 2026 — MAX-ALPHA automatic update opt-in (separate draft)

- Current website copy now has a saved Settings → Install & updates checkbox for app-requested automatic checks. New and migrated records default it off; manual checking remains available. Internet permission remains authoritative. App-requested automatic activation is disabled until an independently signed channel exists; existing active-work/draft guards remain intact for manual Update & reopen.
- Review version 1.16.3/build224 and new service-worker cache identifier; regenerated all 94 manifest entries from repository LF bytes. Browser-managed service-worker lifecycle is separate from this app setting. The existing manifest remains unsigned and uses HTTPS/SHA256 integrity; signed foundation PR #1 is NOT imported or activated here.
- Tests: 19 MAX-ALPHA tests (nine opt-in cases, two stale/mismatched-release cases, three provider-input protections, one release-integrity test and four branding/activity cases), JavaScript syntax, nine catalog/portfolio regressions and whitespace checks. Isolated Edge UI passed at 1365px and 393px: default-off, enable/disable persistence across reload, trust disclosure, 44px touch target, pre-request pasted-key rejection, preserved unsent draft and honest offline error. External requests were blocked; zero occurred. Service workers were blocked for this UI test; real offline-cache/update lifecycle and physical devices remain unverified.
- Reconciled applicability of standalone security branch ec21c0560d90b273517750be1d83626245d1b4e5. Website already has no direct-provider key requests/persistence/import/export/testing; ported only provider-prefix rejection for support tokens and pasted-key rejection before history/queue/requests. Did not copy unrelated standalone features or storage migration, read/delete credentials or activate providers. Standalone source/security branches remain untouched.
- Catalog and installation guide identify web 1.16.3/build224 and explicit opt-in/manual-activation/signing limits. Deployment must preserve all native installers, private routes and other app sources. Only this scoped MAX-ALPHA change is eligible for publication after final exact-Git-byte/release checks; no all-app completion or native installer claim.
- Supported direct Library preparation succeeded for the verified newer native sources, but the official transfer helper then failed because Windows Python lacks os.setxattr. Preserve Library identity; cloud can publish reviewed source-only draft branches after source/secrets checks for a supported Git checkout here. Never use incomplete staging downloads as authoritative sources.

## October 11, 2026 - Authorized test-package publication

- Michael explicitly approved publishing the verified current packages to GitHub and goyonebydesign.com. GitHub prerelease apps-test-2026-10-11 is public; all five assets were downloaded anonymously with HTTP200 and exact size/SHA256 matches before website deployment.
- Current downloads: JustMyPick0.38/build38 Android debug APK; StatusPing0.2.0-review.3/build5 Android debug APK; VIEW4REAL0.2.2 Windows x64 unsigned portable ZIP containing the actual executable. Versioned website copies, current catalog records, Installation help links, GitHub mirrors, release notes and checksum metadata use the exact tested bytes. Prior binaries, releases and source history retained; no cleanup ran.
- Warnings next to the download links identify isolated debug/unsigned status, unverified physical/live integrations and no production upgrade guarantee. JustMyPick's certificate differs from old SavvyKin0.36; an in-place update requires its original signing key. Do not uninstall/erase user data or bypass security protections. No compatible original key was found in the inspected local projects and signing configuration; no key changed or uploaded.
- The public gallery remains a portfolio and links to the explicitly authorized test-download guide. Owner entry and private workspace routes remain unchanged. Updating the separately hosted private owner hub's actual links requires its supported tool; that hub was not modified here.
- Checks passed: native package tests recorded in release notes, complete GitHub anonymous download integrity, catalog/asset/package validation, four portfolio +five catalog simulations, ten real headless Edge desktop/phone page checks. Final actual browser download-click and deployed Pages/served-byte evidence are recorded in the execution report. No Chrome/form interaction, real message/payment or paid CI.
- GitHub Pages is the existing legacy main/root deployment on www.goyonebydesign.com. Push main only after final source/download checks; verify latest build commit and live HTML/package bytes afterward. Earlier local-only/pending-publication notes below are historical.


## October 11, 2026 - Tested visible rebrand working branch

- VIEW4REAL is the visible product name on the homepage, catalog, product and subscription-agreement pages. Hidden aliases/routes retain compatibility. Subscription agreement changed only product-name casing; its substantive terms remain unchanged.
- JustMyPick copy identifies locally tested Android 0.38 / build 38. The archived SavvyKin 0.36 APK and old SightSync installers remain preserved but are removed from the active catalog download metadata. No corrected package was published to the website or owner hub.
- Checks passed: catalog generation/validation, four portfolio simulations, five catalog UI simulations, and ten actual isolated headless Edge page/viewport branding and overflow checks at 1440 and 393 pixels. External requests blocked; no forms, owner login, payments or Chrome interaction.
- Current public gallery has no download buttons; a fresh uncached live response confirmed this. The retained repository APK still labels itself SavvyKin. The authenticated owner hub's active download target was not inspected.
- Next publication step: use the exact tested package, verify public served SHA256 and installer display branding, update the owner hub's actual destination, then review/merge and verify deployment. The JustMyPick test certificate differs from the archived 0.36 certificate; an in-place phone update requires the original key. VIEW4REAL 0.2.2 unsigned portable ZIP passed application/research/browser/native Rust tests and private-desktop window launch/responsiveness/close. Hardware and interactive native controls remain unverified. Tested ZIP Library libfile_c098783fb0a881919325289dbeb7e273, version0; no public package URL exists.
- This branch changes source only; no main-branch merge, website deployment, release asset upload or store publication.


## October 9, 2026 — Selected Questrix Dialogue Q branding

- Replaced the generic Questrix project mark on the homepage, app-gallery card and gallery icon navigation with Michael’s selected concept 1, Dialogue Q. Added its matching transparent wordmark on light panels; original production artwork is reused without redrawing.
- Preserved the existing development screenshot and identified the selected branding as card artwork. No Questrix runtime, application internals, authentication, other project branding or site layout was changed.
- Rollback baseline: 82613a867803639c983964c35e4bf075a12030d9, retained as backup/pre-questrix-logo-2026-10-09, plus a verified full-history Git bundle. Source tests, deterministic regeneration, asset checks and a scoped revert dry-run are required before publication. Browser launch remains unavailable in this environment; artwork pixels were inspected directly.


## October 9, 2026 — Approved public portfolio redesign

- Applied Michael’s approved portfolio composition with his requested charcoal background, warm-white typography, Manrope display / DM Sans body fonts and orange-red accent. Font files are self-hosted with their OFL licenses. Photographs remain bright and unfiltered, with no dark overlay.
- Reused the original supplied GoyoneByDesign, Anita’s and StockPilot artwork. StockPilot’s original teal/navy icon and primary logo replace the generic letter mark. Actual Arlington photography and the explicitly labeled Bull Run design mockup remain distinct.
- Homepage and /apps/ are public portfolio surfaces: project purpose, features, authentic previews and honest development notes. Public gallery launch/download controls are removed. Owner sign-in at /owner/ redirects to the separately hosted owner-private hub: https://goyone-owner-hub.michaelgoyone78.chatgpt.site . This is genuine platform-restricted access, not a browser PIN gate.
- Preserved existing /pmix/, /max/, /boardroom/ redirects, all MAX-ALPHA / PMIX runtime bytes, DNS/CNAME, original installers and release URLs. Existing public source, binaries and GitHub history remain public; placing links in the private hub does not make these artifacts confidential. Additional private hosting/migration is a separate security task.
- Retained the existing Formspree destination and contact fields, with a single validated submit handler and error recovery. No contact message was sent during tests.
- Rollback baseline: 2a047aca9f3081bcac7bd3996d1646bacb52b088, retained as backup/pre-redesign-2026-10-09. A full-history Git bundle and exact 302-file baseline archive were verified before edits. Roll back through a history-preserving revert of the scoped redesign commit, without force push or overwriting concurrent unrelated work.
- Source verification: nine catalog cards, all asset/local-link checks, preserved installer checksum metadata, five existing catalog UI simulations, four portfolio interaction/contact simulations, nine release-cleanup tests, deterministic generation, JavaScript syntax and whitespace checks. Chromium launch failed due environment socket permissions, including the elevated retry: visual/responsive browser QA and real contact delivery are not claimed. Deployment and served-byte checks are recorded in the task result.


## October 7, 2026 — Existing public app-hub corrections

- Reconciled BOARDROOM into the nine-record catalog so regeneration preserves the existing private-app launch card. Kept MyThang removed, the same three existing public test downloads, their exact destinations and checksums, and all private app access controls unchanged.
- Corrected explicit download URL handling, development filters, legacy anchors and legacy/native-build labels. Updated JustMyPick display branding while clearly identifying the old SavvyKin v0.36 APK; no new APK, iPhone package, Windows EXE or private source archive is published.
- Catalog metadata identifies the already-live MAX-ALPHA v1.16.2 / build 223 and MAX-ZETA v3.61.0 / build 84. View4Real v0.2.1 is labeled source work only; its existing SightSync v0.1.0 download remains a legacy test.
- Based publication on current website main ac97b0747f9e04b4290c24b4ddc7d81784f90061. Preserve every MAX-ALPHA runtime/release byte and its cancellation/import fix. The earlier October 7 MAX-ALPHA handoff remains below.
- Verification for this update: nine catalog records, three installer links and 21 disabled platform buttons; five simulated UI cases; nine release-cleanup tests using temporary fixtures only; JavaScript syntax, deterministic generation, scoped-diff and whitespace checks. Re-run these against final source before publication. Prior anonymous package integrity checks were completed October 6. No physical-device, signing, or real-browser/responsive-layout verification is claimed; the previously canceled cloud browser action is not retried.
- Owner requested publication October 7. GitHub Pages publishes main automatically; verify the exact remote commit, Pages success and served asset bytes before reporting the hub live. No provider activation, credential setup, payment or private-access changes belong to this update.

## October 5, 2026 — MyThang catalog removal

- Removed MyThang from the public catalog, icon navigation, and installation help. Preserved its source project, artwork and history. The public page now has nine cards; the remaining cards and download URLs are unchanged.
- Used a targeted HTML update because the existing generated page includes BOARDROOM and a site-local SavvyKin download that the current generator does not preserve. Do not regenerate the page until that existing source/render drift is reconciled.
- Checks: JavaScript syntax and whitespace validation passed. Focused checks confirm every remaining catalog record and rendered card is unchanged, the displayed count is nine, the three existing installer links and 21 disabled controls remain, and referenced artwork exists.
- Existing aggregate check limitation: `node scripts/check-apps.mjs` fails its final card-count assertion both before (10 rendered / 9 records) and after (9 rendered / 8 records), because BOARDROOM exists only in the rendered page. This unrelated mismatch was not changed. GitHub Pages and live-browser publication are verified separately after synchronization.

## September 26, 2026 — Homepage app navigation cleanup

- Removed individual app shortcuts from the homepage top bar, navigation, hero and footer, including MAX-ALPHA install and MAX-ZETA links. Removed the separate SightSync/View4Real promotion; the existing Apps collection retains its product links and downloads.
- Homepage navigation and footer use Apps. Homepage metadata now describes the whole collection; JavaScript no longer overwrites it with a single product title.
- Added Questrix’s repository-documented Google AI Studio project link, labeled as AI Studio with possible owner sign-in. The Commissary and StockPilot remain visible with actual previews; their deployed web addresses have not been supplied or found, so launch links are pending. Do not invent addresses or label source repositories as running apps.
- Checks: catalog validation (8 cards, 2 enabled native downloads, 22 disabled native controls), JavaScript syntax, homepage link audit, local browser navigation and catalog inspection. No app authentication or private business data was changed.

## Applications catalog — September 26, 2026

- Added /apps/ with eight projects, approved artwork, genuine local screenshots or clearly labeled brand/product illustrations, search/filtering and enlarged previews. Homepage navigation, hero and Applications section link to the catalog; sitemap includes it.
- Edit apps/catalog.json and run `node scripts/build-apps.mjs`. Run `node scripts/check-apps.mjs` and `node --check apps/apps.js`. See apps/README.md for asset provenance, download rules and retention.
- Public prerelease archive: https://github.com/GoyoneByDesign/goyonebydesign/releases/tag/apps-preview-2026-09-26. Contains StatusPing 0.1.0 Android test APK, legacy SightSync 0.1.0 Windows EXE and MSI, and SHA256SUMS.txt. All three installers were anonymously downloaded and hashes verified. These are not store-approved releases. Private source repositories remain private.
- Two native download buttons are enabled (StatusPing Android and SightSync Windows); 22 unavailable platform buttons are disabled. Browser/PWA links stay separate. MAX-ZETA private screens and unavailable SavvyKin runtime are not fabricated.
- Browser checks: desktop and 393x852 mobile, no horizontal overflow, available filter selects two cards, name search/empty state, dialog opening/closing and disabled platform controls. No real messages, forms, inventory changes or external app provider actions were submitted.
- GitHub Pages publishes main at the repository root. Verify the live /apps/ URL and final synchronization after pushing; source code checks alone do not prove deployment.
- Deployment verified September 26: GitHub Pages run 36277599779 succeeded; https://www.goyonebydesign.com/apps/ returned HTTP 200 and was inspected in the browser. Published filters showed the two downloadable apps, both real release URLs, and 22 disabled platform controls. Homepage navigation was then compacted by grouping MAX-ALPHA/MAX-ZETA under Applications; their app links remain in the gallery.
- Cleanup limitation: automatic approval review blocked recursive deletion of obsolete StatusPing build folders and the temporary Questrix/Commissary preview dependencies. They remain locally. Preview servers for those two apps were stopped; source and private exports were preserved.

## Project and source map

This repository contains the public website (`index.html`, `app.js`, `styles.css`), product pages (`max/`, `view4real/`, `sightsync/`, `pmix/`), a MAX-ALPHA browser copy in `max-alpha/`, and the PMIX application in `pmix-app/`. Select the relevant component before editing. The standalone MAX-ALPHA repository is separate; do not silently replace either copy with the other.

## Setup and verification

- Static website: from the repository root, run `python3 -m http.server 8765 --bind 127.0.0.1`; on Windows use `py -m http.server 8765 --bind 127.0.0.1`. Visit http://127.0.0.1:8765 and check changed pages and asset links.
- MAX-ALPHA browser copy: Node.js 22 or newer. From `max-alpha`, run `npm test`. See `max-alpha/README.md` for setup.
- PMIX: from `pmix-app`, run `npm ci`, `npm test`, and `npm run build`. Read `pmix-app/README.md` and `pmix-app/.env.example` before using external services or deployment.
- There is no root package manifest; run package commands in the appropriate component directory.

## Known boundaries and next step

The static product pages and the actual application code have different roles. Preserve published URL paths, official branding, and existing deployments. No deployment was performed by this handoff update. Start by identifying which product the user wants to change and reviewing that component's current source and tests.

## Opening this project with another assistant

1. Clone this repository, or open its existing clean checkout. Confirm the origin and branch before making changes.
2. Antigravity: open the repository folder as the project. It can discover root `AGENTS.md` and `GEMINI.md`; explicitly ask it to read `AI_HANDOFF.md`.
3. ChatGPT/Codex: use a coding environment with this repository connected or checked out. For a chat-only session, provide the relevant source files plus this guide; do not assume the chat can edit or push GitHub.
4. Gemini CLI: start in the repository root and read `GEMINI.md`. For Gemini chat, provide the relevant source and this guide using the file/repository access available to that product.
5. Authenticate each service separately for private repositories. App runtime API keys are separate from an assistant subscription or GitHub login.

Suggested first prompt:

> Read AGENTS.md, AI_HANDOFF.md, and README.md. Inspect the current branch and working tree. Summarize the architecture and known blockers, verify the documented development commands for the requested task, then implement the requested change. Preserve existing work and update the handoff with actual verification results. Commit and push the intended source changes when access is available.

## Handoff maintenance

After a work session, record the date, branch, completed changes, checks and results, unresolved issues, next concrete step, and whether the last push succeeded. Retrieve exact commit IDs with Git rather than maintaining a self-referencing commit hash inside this file. Do not include credentials or private user data.

## Verification of this guide

Prepared September 26, 2026 from repository documentation and manifests. This is a documentation and assistant-context update. Application builds, live API integrations, and execution inside each assistant were not tested as part of this update. Before feature work, run the relevant checks below and record the result.

## Tool documentation

- [Antigravity project rules](https://www.antigravity.google/docs/rules/)
- [Gemini CLI project context](https://geminicli.com/docs/cli/gemini-md/)
- [Codex AGENTS.md instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

## September 26 — Catalog completion and release retention

Preserved the concurrently published catalog, its official artwork/screenshots, compact homepage navigation, and public StatusPing/SightSync release links. Added MyThang (nine apps), MAX-ALPHA web install/update help, corrected SAVVYKIN local source/build availability, and a bounded release cleanup script with nine retention/refusal tests. The source of truth remains apps/catalog.json with scripts/build-apps.mjs. See apps/MAINTENANCE.md. No native app binary or private runtime data was changed. Published bytes and responsive browser behavior are verified in the accompanying release report; physical device testing remains pending.


## October 3, 2026 — MAX-ALPHA identity update

Renamed active MAX-ALPHA UI, persona text, manifests, exports, documentation, test filenames and website catalog/path. Added a centered A to the native SVG character and generated install-icon artwork. The A uses existing real processing/speaking signals, pulses gently, is idle-off and static with reduced motion. Occasional natural blinks also respect reduced motion. Preserved separate website/app baselines, personal storage/native bridges, existing cloud service endpoints, repository history, homepage and unrelated apps. Legacy website/install route migration preserves query/hash and user data.

Verification: dedicated application baseline tests plus branding/activity tests, JavaScript syntax, release manifest integrity and catalog validation. Browser preview at loopback is blocked in the cloud browser; published verification will be reported after Pages completes. No live API calls, fees, credential changes or native-device tests. GitHub repository metadata rename was completed by the owner and verified with stable repository ID 1389535974. See RENAME-COMPATIBILITY.md in the application directory.

## October 7, 2026 — MAX-ALPHA file-picker cancellation fix

Public MAX-ALPHA v1.16.2 / build 223 changes only the Settings dialog cancel listener: ignore bubbled file-input cancel events, while actual dialog cancellation still aborts pending settings work. This prevents a cancelled picker from silently disabling later session-token imports. Required service-worker cache/release metadata and changed-file integrity hashes are updated together. No app catalog, unrelated app, private security branch, credential setup or provider behavior changes.

Verification: four synthetic-token cancellation/import regression tests passed; four existing public branding/activity/storage tests passed; app.js and sw.js syntax checks and changed-file release hashes passed on Windows/Node. No real key file, clipboard or secret was read; no inference or paid API call was made. Interactive browser/native-device QA unavailable. Existing installed sessions must use Check updates / Update & reopen after saving work. GitHub connector publication and live static asset verification are recorded in the task result; no Pages configuration changes.

## October 15, 2026 - visible history and hosted setup checks

Prepared MAX-ALPHA 1.16.5/build226: added visible local release history and an explicit hosted-service health check, retaining device readiness. No inference, credentials or account connections. Added shared portal history with Eastern dates, explicit build/source/package distinctions, and preserved unknown historical values. Validation: 25 MAX tests, 3 history-generator tests, 16 desktop/mobile history checks, and mocked button check (zero background health requests; two explicit GETs only). All 138 Commissary forms remain equivalent after patched SheetJS. Publication and exact commit references are reported separately; existing native installers and preview-only gallery status remain unchanged.



## October 16, 2026 - Daily research review (8:51 AM EDT)

Added the public documentation-only review at apps/research/2026-10-16/ and one linked research entry in the existing portal history. Preserved all older history entries and the existing portal 1.0.1/build2 baseline. App code, workers, model configuration, release metadata, native downloads and private access are unchanged. VIEW4REAL papers remain experimental comparison candidates and do not establish eyesight benefit. The MAX-ALPHA Gemini request-contract observation is untested and does not establish a live failure.

Verification: three existing history-generator tests pass; focused checks cover deterministic history generation, preservation of every previous history record, research HTML structure/links and the documentation-only file scope. No new app runtime, live inference, optical-bench, human or physical-device test ran. Remote commit, Pages deployment and served content must be checked separately before reporting publication.

## October 16, 2026 - View4Real 0.2.3 / build 3 branding publication
Reused byte-identical approved View4Real website SVG and GoyoneByDesign company PNG. Both render in the app header; native executable icon was extracted and reviewed. Exact copied-folder Windows WebView2 checks passed for logos, title/build, large print, history and clean close. Automated checks: 16 source, 7 Rust, 42 optical, 24 solver, 25 harness and 22 Dell Edge browser checks. Public GitHub ZIP readback matched SHA256 ec755d1cc0c2dee42f52bea46b70805b22fb4f2ff4bb74ef84751fc1795b3a72. Scoped portal catalog, guide and history update preserve JustMyPick and prior downloads. Private Drive backup upload was rejected by automatic approval review for insufficient explicit payload/destination authorization; no retry or cleanup occurred. Source and binary are preserved locally and in the authorized GitHub repositories. Website deployment and live checksum remain to be verified before completion.


## October 17, 2026 - Daily research review (9:00 AM EDT)

Added the sanitized documentation-only review at apps/research/2026-10-17/ and one linked portal-history entry. The review reconciles release/source channels and records no application-code change after international primary-source checks. The older SharpView Font study is a comparison candidate with explicit contrast and evidence limits; no font, model, paper asset or dependency is bundled. Toast development and real inspection remain stopped. No private source links, project records or recovery locations are added.

Preserved every previous history entry, portal 1.0.1/build2, releasedAt:null for this research record, application code, native downloads and access settings. Verification: three existing history tests plus focused deterministic-generation, append-only history, source/HTML consistency, safe-link, privacy and five-file-scope checks pass. Static cloud-Chromium desktop/mobile checks were blocked before page load by sandbox socket restrictions; the supported escalation also failed during sandbox setup. No visual/browser pass is claimed. No new app runtime, provider inference, physical-device, optical-bench or human test ran. Exact remote commit, Pages result and live research/history bytes must be checked separately before claiming publication.

## October 19, 2026 — StockPilot review-source evidence

Updated only StockPilot catalog availability and version history, preserving existing screenshots, installer files/hashes, owner-only destinations and other app entries. The separate private review branch is 1.0.4-review.1/build4; main remains 1.0.3/build3. Recorded 365 Node, 19 local Worker/D1 and 2 hosted-proof passing tests plus real local Chrome Node/synthetic workflows; none establishes a hosted backend or live supplier acceptance. Timestamp is source preparation, not deployment. Source history references the private draft PR. History/catalog source tests pass 8/8 and full catalog integrity check passes (9 preview cards/3 preserved installers). Publication/served-byte verification is recorded in task result.

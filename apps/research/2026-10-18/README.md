# App research log: October 18, 2026

**Reviewed October 18, 2026 at 8:12 AM EDT (America/New_York; 12:12 UTC).**

**Decision: no application-code, model, installer or version change.** This review reconciles the existing releases with current official documentation and international display research. No newly verified ordinary-screen result justified a production correction algorithm or stronger eyesight claim. Documentation checks are distinct from app tests; no new application, provider, native-device, optical-bench or human test ran.

## Current catalog and release channels

The [catalog](https://github.com/GoyoneByDesign/goyonebydesign/blob/76e0c41cfc806cb82a22ad9f8eec0c31aba71dc5/apps/catalog.json), [preserved update history](https://www.goyonebydesign.com/apps/updates/) and [October 17 research review](https://www.goyonebydesign.com/apps/research/2026-10-17/) were reconciled. The website source baseline for this review is [76e0c41](https://github.com/GoyoneByDesign/goyonebydesign/commit/76e0c41cfc806cb82a22ad9f8eec0c31aba71dc5). Repository main, a development branch, a download and a private deployment can have different versions. No private records, recovery locations or credentials are included.

- **View4Real:** retain the published 0.2.3/build 3 unsigned Windows x64 test ZIP. Its native branding, reader and history checks are already recorded; this review did not repeat them. Physical brightness hardware and clinical benefit remain unverified. Older default-main source is not the release baseline. No Android/iOS installer is established.
- **JustMyPick:** retain the 0.38/build 38 debug test APK. Clean installation and cold launch passed the previously recorded emulator check; the old SavvyKin 0.36 in-place upgrade fails because its signing identity differs. Preserve existing app data. Physical-phone acceptance remains unverified.
- **MAX-ALPHA:** deployed website 1.16.6/build 227 remains separate from the standalone repository. No model switch, live inference or automatic-update policy change.
- **StatusPing:** the downloadable 0.2.0-review.3/build 5 debug APK is distinct from main-source maintenance 0.1.2/build 3. Source CI is not qualification of the exact public APK on a real phone.
- **StockPilot:** main-source 1.0.3/build 3 and its already recorded 285 local tests now supersede the older 1.0.2 main-source observation. The shutdown repair is source-only; no production backend or live supplier/store acceptance is established. Separate broader development remains unmerged and must not be overwritten or counted as deployed.
- **Questrix and The Commissary:** main-source 0.0.2/build 2 and owner-private preview 0.0.1/build 1 remain distinct. No new authenticated storage, concurrency, export/restore or physical Safari test.
- **BOARDROOM:** retain the owner-private 2.0.1/build 1 preview. Configured AI teammate preferences do not establish connected services.
- **MAX-ZETA:** the public catalog's 3.61.0/build 84 is historical; the current private reporting workspace is maintained separately. Do not overwrite it with an older source copy. Private data reconciliation is not an outcome of this public review.
- **Bibo's Giggles, the website portal and owner hub:** retain their existing website/private-deployment scope. The portal remains 1.0.1/build 2.
- **Toast Training:** development and real Toast inspection remain explicitly stopped. Historical entries that described an active task do not resume it. **MyThang remains removed.**

The nine gallery cards are not a count of every repository, preview or historical program. No new app was added to the gallery, and no prototype was promoted to production status.

## Display research: dated evidence, unchanged recommendation

English, Japanese and Chinese primary-source searches and date checks found no newly verified controlled ordinary-screen human result warranting a release change since October 17. This is a bounded search, not proof that no advances exist.

**Alkzir/PyOLimp remains the known September 20, 2026 baseline.** Its human comparison used simulated retinal images rather than individually matched real-eye correction. Reported 512-by-512-image runtimes include USRNet-PC at 0.975 seconds on GPU and DWDN-PC at 5.644 seconds on x86 and 118.331 seconds on ARM; those figures are not live-display rates. The study uses fixed pupil/image assumptions and leaves mismatch robustness unresolved. The MIT license at the code repository's top level does not settle every model-weight or dataset right. The linked dataset was published July 15, 2025, not September 2026; its license field did not establish reuse rights in the checked record. [Paper](https://www.mdpi.com/2313-433X/12/9/456), [code](https://github.com/pyolimp/pyolimp), [dataset](https://zenodo.org/records/15926161)

**Previously reviewed methods are not relabeled new.** The [inverse-filtering preprint](https://arxiv.org/abs/2501.01450) remains version 1 submitted December 30, 2024; a 2026 date on an HTML rendering does not make it a new submission. Its SSIM result measures reconvolved images, not eyesight improvement. Ringing, tile seams and differing-eye requirements remain limitations. [Nagoya's VISAPP 2026 binocular model](https://www.scitepress.org/PublishedPapers/2026/144351/) remains simulation evidence. ChromaCorrect, Huang, Montalto, Tanaka/Kawano and yesterday's SharpView Font review remain earlier comparisons.

**Newly checked older hardware-only background:** Liu and colleagues' [Alvarez-lens near-eye display](https://opg.optica.org/ol/abstract.cfm?uri=ol-50-22-7127), published November 12, 2025, uses physical displaced lenses. Peng and colleagues' [metalens-array light-field study](https://opg.optica.org/ao/abstract.cfm?uri=ao-65-18-6168), published June 12, 2026, reports simulation and data available on request. Akpinar and colleagues' [wavefront-coding work](https://arxiv.org/abs/2510.12778), submitted October 14, 2025, uses a custom diffractive optical element and neural processing. These are additional background sources, not October 18 inventions or ordinary-screen software deployment evidence.

**TDK watchlist refresh:** the Japanese [CEATEC page](https://site.tdk.com/ceatec2026_index) lists its meta-optic mirror as under development and records an award. The [press index](https://www.tdk.com/news_center/press/index.html) dates the award announcement to October 6; the [October 2 release](https://www.tdk.com/en/news_center/press/20261002_01.html) still describes a monochrome prototype with full-color production in the future. This is not a new October 18 human reading-benefit result. Apple's [September 16 Japanese digital-prism guidance](https://support.apple.com/ja-jp/121387) concerns supported prescriptions in a separate-display Vision Pro headset, not sphere/cylinder correction on a shared ordinary screen.

**Decision:** add no model, font, paper asset, camera access or dependency. Preserve the original-image bypass, semantic text and accessible enlargement. Future bounded synthetic work should record physical scale, pupil/distance assumptions, per-eye outcomes, clipping, contrast, halos, mismatch, runtime and cancellation, using unchanged text and ordinary sharpening as baselines. Previously recorded negative cases remain valid. Optical-bench forward validation and appropriate controlled reading-accuracy, speed and comfort evaluation remain missing gates. Screenshots, SSIM and informal preferences cannot establish glasses replacement.

## MAX-ALPHA: request and response contracts

The [current public worker source](https://github.com/GoyoneByDesign/goyonebydesign/blob/76e0c41cfc806cb82a22ad9f8eec0c31aba71dc5/max-alpha/gemini-worker.js) still requests gemini-3.5-flash-lite with temperature 0, candidateCount 1 and maxOutputTokens 512. Google's [migration guide](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6), updated October 13, still says sampling parameters are deprecated/ignored and candidate_count is unsupported for Gemini 3 and later. This is the existing October 16/17 compatibility candidate, not a newly observed outage. The final request turn is already a user turn.

The current [REST response reference](https://ai.google.dev/api/generate-content) also documents CONTINUATION: generation is incomplete and continuation would require another request. This review newly checked that contract; it does not establish when that behavior first appeared or whether the configured model emits it. Static source inspection shows MAX-ALPHA accepts only STOP, rejects MAX_TOKENS and other finish reasons, handles prompt blocks/empty text, and has no automatic continuation. It does not silently treat these partial responses as success.

**Next engineering candidate:** no-network fixtures covering complete, blocked, empty, truncated, CONTINUATION, unknown-finish, malformed, cancelled and failed responses, plus the exact request fields. Preserve authentication, the one-question/no-history boundary, model selection, limits and no automatic retry or paid fallback. No fixture was executed and no provider request was made today.

## Android: signing and reminder reliability

Android's [signing guide](https://developer.android.com/studio/publish/app-signing), last updated March 6, 2026, distinguishes the installed app-signing key from a Play upload key. Resetting an upload key is not a general way to replace the signing identity of an existing sideloaded installation. No applicable managed signing-key recovery route has been established for the old JustMyPick/SavvyKin package. **Do not uninstall or clear the existing app to bypass an upgrade failure.**

For StatusPing, Android 15's [stopped-state behavior](https://developer.android.com/about/versions/15/behavior-changes-all#stopped-state) cancels pending intents on force-stop; direct or indirect user interaction is needed to leave that state. The [alarm guide](https://developer.android.com/develop/background-work/services/alarms) also documents alarms being canceled at device shutdown and the separate rescheduling path after boot. These are existing platform rules, not new October 18 features.

**Decision:** retain the exact-APK test matrix for Doze, reboot, force-stop/reopen, denied/restored permissions, timezone/DST and duplicate prevention. Do not extrapolate emulator source checks to physical-phone reliability, or a local reminder to delivered caregiver messages. No permission, signing, package or device change was made.

## Web apps: accessibility, storage and privacy

[WCAG 2.2](https://www.w3.org/TR/WCAG22/) is an existing W3C Recommendation republished December 12, 2024, not a newly announced standard. Useful future checks across Questrix, The Commissary, BOARDROOM and the owner-facing web apps include keyboard operation and focus visibility, focus not entirely hidden by overlays, reflow at 320 CSS pixels with the defined two-dimensional-content exception, target sizing/spacing and accessible authentication. Test actual sign-in, dialogs, errors and export/restore flows; a visually narrow screenshot does not establish conformance. No WCAG conformance claim is made.

The [WHATWG Storage Standard](https://storage.spec.whatwg.org/) starts local storage buckets in best-effort mode and distinguishes storage-pressure handling from persistent storage. WebKit's [storage-policy article](https://webkit.org/blog/14403/updates-to-storage-policy/) dates to August 10, 2023 and was already referenced in earlier reviews. Persistence is not an off-device backup.

**Decision:** keep owner-only access unchanged. Future isolated checks should cover failed/interrupted writes, concurrent edits, restart, truthful saved/error status and reviewed export/restore using synthetic data. Verify each app's actual storage path instead of assuming browser and server storage are interchangeable. Do not clear Safari data, remove installed web apps, upload private records or expand permissions for an icon or research check.

## StockPilot: preserve the completed shutdown repair

The [existing source-update history](https://www.goyonebydesign.com/apps/updates/#stockpilot) already records version 1.0.3/build 3, 285 local tests and the isolated Windows database-release check. This research does not repeat or supersede that result.

The [Node 24.18.0 SQLite reference](https://nodejs.org/download/release/v24.18.0/docs/api/sqlite.html) documents database.close() as a wrapper around sqlite3_close_v2(). [SQLite's own contract](https://www.sqlite.org/c3ref/close.html) explains that outstanding statements, blob handles or backup objects can defer actual resource deallocation. This supports retaining the completed shutdown and resource-release regression; an HTTP listener stopping alone is not evidence that database work has finished.

**Decision:** do not implement the same repair again. Keep the main maintenance channel separate from broader unmerged work. Existing synthetic restore evidence should be reused before proposing duplicate tests. Real provider reconciliation, approved hosting/authentication and production recovery remain separate gates. No supplier, listing, order, account, database or commerce action occurred.

## Outcome and verification limits

Only a dated research document and one linked history entry are prepared by this review. Existing history, app versions, installers, download hashes, model settings, private access and paused work are preserved.

Documentation validation covers valid JSON, one unique dated record, unchanged earlier history and HTML outside the inserted article, HTTPS references and a four-file documentation-only scope. These are not application tests. App lint/build, native-device, provider and clinical tests were not run; this documentation review made no app-code change. Browser visual QA was not run. Remote publication and live-page availability are verified separately from these content checks.

The useful result is an updated, dated evidence record and explicit no-change decisions. No eyesight improvement, clinical correction, production reliability or new release is claimed.

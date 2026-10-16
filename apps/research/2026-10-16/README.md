# App research log: October 16, 2026

**Reviewed October 16, 2026 at 8:51 AM EDT (America/New_York; 12:51 UTC).**

**Decision: retain the current applications while evaluating the test candidates below.** This is a documentation-only research update, not an app release. No application source, version, native download, account, permission or private data changed. Newly identified means absent from the prior project research reviewed, not published today. Publication dates and documentation update dates are distinguished below.

## Current baseline and no-change decisions

The nine-app [public catalog](https://www.goyonebydesign.com/apps/) and [update history](https://www.goyonebydesign.com/apps/updates/) were checked against the current [website source](https://github.com/GoyoneByDesign/goyonebydesign/tree/eafd6272fa221273f8ff5bc0f68f9017fcf382e0).

- **MAX-ALPHA:** website 1.16.6 / build 227. The source-level provider-contract candidate below is untested. The worker, configured model and release remain unchanged
- **VIEW4REAL:** public 0.2.2 unsigned Windows x64 portable test ZIP. The separately reviewed 0.2.3 / build 1 source has not replaced that download. New papers are experimental comparison candidates; they establish no eyesight benefit
- **StatusPing:** 0.1.2 / build 3 icon-maintenance source and Android 35 CI are separate from the existing 0.2.0-review.3 / build 5 debug test APK. Exact-package real-phone qualification is still needed
- **StockPilot:** 1.0.2 / build 2 is a source record; this review establishes no runtime hosting. Prior mocked tests do not establish sandbox integration or safe restore
- **Questrix, The Commissary and BOARDROOM:** main source and private-preview versions remain separate channels. Use synthetic save/restore tests before broader features; no private source or application records are included here
- **JustMyPick:** the existing 0.38 / build 38 debug test package and its signing/upgrade limitations remain unchanged. No newly reviewed finding justified another package
- **Bibo's Giggles and the website portal:** their October 16 icon updates are documented in the existing [publication outcome](https://www.goyonebydesign.com/apps/ICON-OUTCOME-2026-10-16.md). This review makes no further code change
- **MAX-ZETA and Toast Training App:** separate application work is outside this research update. This entry makes no new version, deployment or test claim for either

The [October 15 outcome](https://www.goyonebydesign.com/apps/OUTCOME-2026-10-15.md) retains earlier validation results and limitations. Source-only work, experimental packages and deployed applications are not interchangeable.

## Newly identified research relevant to VIEW4REAL

### 1. Personalized neural precompensation: stronger comparison candidate

**Published September 20, 2026; reviewed October 16.** Alkzir et al. compare USRNet-PC, DWDN-PC and KerUnc-PC with established methods. The principal contribution for this project is a reproducible benchmark candidate, not a product-ready filter. Their human evaluation used simulated retinal images and participants instructed to use normal or corrected vision; displays were uncalibrated. The authors explicitly describe computational limits and lack of clinical-effectiveness evidence. Their image test set is broader than the current prototype's synthetic examples, but a new independent PSF holdout remains important. [Paper](https://www.mdpi.com/2313-433X/12/9/456), [publication date](https://pubmed.ncbi.nlm.nih.gov/42783880/)

**Decision:** investigate an offline, synthetic comparison before any integration. The paper pins Pyolimp revision `e3db3bf2897753aa8d27ec8b299621ee6a77dd35`; its top-level code license is MIT. That does not establish all upstream code, dataset or weight redistribution rights. The linked dataset record dates to **July 15, 2025**, despite the journal article being published in 2026; its description still references a 2025 paper. Do not call the dataset a new October release. No package, data or weights were downloaded. [Pinned license](https://github.com/pyolimp/pyolimp/blob/e3db3bf2897753aa8d27ec8b299621ee6a77dd35/LICENSE), [dataset record](https://zenodo.org/records/15926161)

### 2. Japanese binocular modeling: a hypothesis to test independently

**VISAPP 2026; exact publication day not established.** Nagoya Institute of Technology's Yingxin, Sakaue and Sato describe a shared display image optimized through separate eye models and a fusion/rivalry surrogate. Their binocular evaluation uses **1,000 training and 200 test synthetic combinations**. This is simulation evidence, not a measured benefit for people reading an ordinary screen. It is relevant because VIEW4REAL's current weighted two-eye objective deliberately does not model binocular fusion. [Publisher record](https://www.scitepress.org/PublishedPapers/2026/144351/), [paper](https://www.scitepress.org/Papers/2026/144351/144351.pdf)

**Decision:** consider only an isolated comparison of the fusion surrogate against the existing per-eye metrics. Never allow a better fused score to conceal worsening either eye. The paper is labeled **CC BY-NC-ND 4.0**; no reusable implementation or model license was verified. Do not import its figures, code or weights into a commercial app on the assumption that an accessible paper grants those rights. Browser/Windows runtime and compute requirements were not established.

### 3. Gaze-adaptive near-eye correction: useful calibration evidence, different hardware

**Array volume 29, March 2026; reviewed October 16.** Jiang et al. use calibrated spatially varying PSFs and gaze-aware neural processing, with simulation and a VR optical-system/camera bench. Reported inference is approximately **11 ms for a 280 × 280 region on an RTX 4090**. That is not a full ordinary-screen latency result. The suggested approximately 1 ms optimized deployment should not be represented as the reported measured baseline. Data are available on request; a redistributable implementation/weights package was not verified. [Official paper](https://doi.org/10.1016/j.array.2025.100654)

**Decision:** retain as support for measured, gaze-dependent forward-model validation. It does not justify adding eye tracking, a neural dependency, or a vision-correction claim to the current Windows app. No camera permission or eye-data collection is proposed.

### 4. Binocular motion safety belongs in later validation

**Published May 4, 2026.** A 53-participant study found that interocular blur/light differences can alter processing delays and produce visible motion-depth illusions for some participants. Its apparatus was an iPad modified with a lenticular sheet, trial lenses and head stabilization. It does not test VIEW4REAL. [Primary study](https://pmc.ncbi.nlm.nih.gov/articles/PMC13164575/)

**Decision:** keep future motion, discomfort and per-eye endpoints separate from static image metrics. Do not infer safe binocular daily use from a static simulated MSE improvement. Formal human evaluation needs appropriate professional/ethics guidance and explicit informed participation.

## Prior work and exclusions

The current [SightSync research context](https://github.com/GoyoneByDesign/SightSync/blob/codex/update-history-20261015/public/research/docs/RESEARCH-CONTEXT.md) already includes ChromaCorrect, Pyolimp, Huang 2013, Montalto 2015 and Tanaka/Kawano 2022. These are not new discoveries in this log. Pyolimp's September 2026 article is an additional publication about an already-known project.

English, Japanese and Chinese searches were used. The Chinese-language [fast HMD deconvolution paper](https://www.jcad.cn/article/id/5cb49030-5bf3-494b-8af1-50675a9f58cb?viewType=citedby-info) is older background, not a 2026 advance. The [high-contrast inverse-blurring preprint](https://arxiv.org/abs/2501.01450) was submitted **December 30, 2024**, despite its 2501 identifier. Its headline SSIM describes reconvolved-image comparison; it notes very limited human tests, tiling artifacts and a proposed future parallax barrier for separate-eye content. It does not establish a glasses-replacement outcome.

## Practical app verification candidates

### MAX-ALPHA: small provider-contract check with a verified source target

Google's migration guide, updated **October 13, 2026**, says Gemini 3.5 Flash-Lite ignores deprecated sampling settings and rejects non-empty final model-role prefills. It also recommends removing unsupported `candidate_count` for Gemini 3+. [Official guide](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6)

The current [Gemini worker source](https://github.com/GoyoneByDesign/goyonebydesign/blob/main/max-alpha/gemini-worker.js) sends `temperature: 0`, `candidateCount: 1` and `maxOutputTokens: 512`; its last content turn is already correctly `user`. This establishes a compatibility-cleanup candidate, **not a demonstrated runtime failure**. Recommended later scope: a no-network fixture check for supported request fields and complete, blocked, empty, truncated, cancelled and failed responses. Preserve the configured model, single-question boundary, authentication, no-history payload, no automatic retries/fallback and opt-in behavior. No account, SDK, model or security change is needed for the fixture audit. A health response still does not prove inference.

### StatusPing: qualify the exact downloadable APK

Android 15 cancels PendingIntents after Force Stop; reopening provides an opportunity to register future work. Alarm permission revocation and reboot also require explicit handling. These are existing platform behaviors; the documentation updates dated **October 1, 2026** are not new feature-release dates. [Stopped-state behavior](https://developer.android.com/about/versions/15/behavior-changes-all#stopped-state), [alarm scheduling](https://developer.android.com/develop/background-work/services/alarms)

Prepare acceptance cases tied to the APK hash, signing identity and matching source: screen-off/Doze, reboot, force-stop then reopen, notification/alarm permissions denied and restored, timezone/DST changes and duplicate prevention. Use synthetic local reminders. Do not expand permissions or switch scheduling modes in this review. A local reminder is not a delivered family alert. Real-phone evidence remains distinct from Android 35 source CI.

### Questrix, The Commissary and BOARDROOM: verify save and restore

WebKit describes best-effort eviction, quota failure and heuristic persistence grants. The policy article is from **August 10, 2023**, not this week's release; the Storage standard is a living specification. Persistence does not establish backup. [WebKit policy](https://webkit.org/blog/14403/updates-to-storage-policy/), [Storage standard](https://storage.spec.whatwg.org/)

First identify whether each deployed record is browser-held or Express-backed. Then use synthetic Questrix responses, Commissary stock movements and BOARDROOM chats to verify interrupted writes, restart, concurrent changes and isolated export/restore. Check record counts, relationships and totals, and never show “saved” after a failed write. Test Safari tab and Home Screen instances separately without deleting existing data. Preserve owner-only access and existing mail-status semantics. No new persistence permission, service or OCR engine is selected.

### StockPilot: keep sandbox, restore and production claims separate

**Undated living documentation; reviewed October 16, 2026.** eBay Sandbox supports fictional transactions but has documented gaps, including shipping-label behavior, dispute transitions and production-equivalent fees. [Sandbox guide](https://developer.ebay.com/api-docs/static/gs_understand-the-sandbox-and.html), [limitations](https://developer.ebay.com/support/knowledge-base/684)

Prepare an endpoint-specific matrix using synthetic identities: request/read-back identifier reconciliation, timeout/duplicate behavior, unsupported-flow labels, and an isolated restore preserving inventory, order mappings, pending jobs and audit history. Restoring must not trigger live fulfillment. The existing 284 mocked tests do not supply this evidence. No new keys, live orders, supplier requests or account setup occurred.

## Recommended next tests and acceptance baseline

Ordinary screens provide a bounded, nonnegative shared image; they cannot emit negative radiance or recover frequencies completely lost by the optical transfer function. Independent eye images require separate optical channels. A sphere/cylinder/axis prescription alone does not measure pupil, accommodation, higher-order aberrations, screen spectrum or binocular perception. The current model interprets inputs as corneal-plane-equivalent powers, without spectacle vertex-distance conversion or worn correction. Keep those assumptions explicit rather than presenting prescription entry as calibration. These are retained constraints from the project's [optical model](https://github.com/GoyoneByDesign/SightSync/blob/codex/update-history-20261015/public/research/docs/OPTICAL-MODEL.md), not a new clinical finding.

1. Smallest actionable engineering candidate: MAX-ALPHA's mocked Gemini request-contract check. Passing source tests would still not establish deployed-worker inference.
2. VIEW4REAL: prioritize its already-documented missing optical-bench/native validation over adding another model. A subsequent comparison can use synthetic PSFs and newly generated text/patterns, including Latin/CJK text, at fixed calibrated scale. Keep normal rendering, enlargement/accessibility and simple sharpening baselines; do not rank enlarged content against an inequivalent small-text target.
3. Preserve fixed linear-light/radiance conventions, bounded pixels, clipping rates, independent PSF holdouts, distance/pupil/accommodation mismatch, and separate-eye results. Record runtime, memory and cancellation on actual supported hardware. Keep accessible semantic controls, zoom/reflow and an immediate neutral reset; a rendered image must not replace the usable text interface.
4. Keep prescriptions, eye measurements, camera feeds and personal documents out of benchmark fixtures and default exports. Validate exact code/data/model licenses before bundling. No newly reviewed evidence establishes commercial readiness, eyesight correction, or replacement for prescribed eyewear.

The current [validation record](https://github.com/GoyoneByDesign/SightSync/blob/codex/update-history-20261015/public/research/docs/VALIDATION.md) already retains a mismatch case where inverse processing worsens one eye and another case where sharpening performs better. Those negative results should remain visible in future comparisons.

## Review outcome

The papers and platform documents support better comparisons and acceptance tests, not immediate feature adoption. No new app experiment or live provider inference ran during this research review. The log publication is checked separately for preserved history, valid links, generated-page consistency and deployed content. No clinical, optical-bench, native-device or production-integration pass is claimed.

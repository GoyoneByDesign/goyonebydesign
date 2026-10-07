# goyonebydesign — AI handoff

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

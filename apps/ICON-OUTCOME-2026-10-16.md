# Safari Home Screen icon update — October 16, 2026

The website uses existing approved artwork, with explicit 180×180 opaque PNG Apple touch icons. No logo was redesigned. No physical iPhone/iPad test was performed.

## Published website surfaces

The root studio, /apps/, MAX-ALPHA /max-alpha/ and install.html, legacy /max-g/, VIEW4REAL /view4real/ and /sightsync/ return HTTP200 and image/png icons at 180×180. Bibo’s Giggles serves the exact prior embedded PNG as a normal file URL; downloaded bytes match the source. See ICON-LIVE-2026-10-16.json for URLs and hashes. GitHub Pages deployments succeeded for portfolio 9c0664e and Bibo bb0c503. MAX-ALPHA is 1.16.6/build227; its manifest identity, original artwork, storage and guarded opt-in update mechanism are preserved.

Toast V2 and V3 already serve their existing 180×180 PNG icons successfully. Neither Toast source nor live POS was modified.

## Other owned app sources

StockPilot 2b27700 (1.0.2/build2), Questrix 957cd6c (0.0.2/build2), The Commissary 1b853c4 (0.0.2/build2), and StatusPing 8b5c883 (0.1.2/build3) are pushed to their established repositories. These source updates are distinct from private Sites previews or existing native installers. StockPilot’s PNG content type is fixed and its isolated HTTP smoke check passes. No verified StockPilot public runtime host is available. Questrix’s Google AI Studio wrapper is outside this source deployment. VIEW4REAL’s older native main source was not overwritten with a different current review branch. JustMyPick has no established hosted web launch target in the inspected inventory.

StatusPing’s initial CI run caught an Android source-version mismatch introduced by the icon maintenance. It was corrected in 8b5c883. Run38895757370 then passed all checks, APK/bundle packaging, Android35 emulator checks and artifact uploads. Published existing APK downloads were not replaced.

## Private Sites

The current owner launcher source c03af5d was packaged and privately deployed, retaining owner-only access. Current Questrix preview c5e6b42 and Commissary preview eef5f79 were built and privately deployed by Sites after Windows dependency installation stalled. Existing preview restrictions and data behavior remain. BOARDROOM source 5c06121 also privately deployed successfully; its 14 client-security checks pass. Their access policies still have one owner and zero external visitors. Anonymous launch requests to the owner launcher, Questrix, Commissary and BOARDROOM return403. This does not establish an authenticated Safari installation test.

MAX-ZETA is owned by a separate coordinated update. This task did not edit its current source or the stale pmix-app copy, preserving its Excel/PDF fixes. Private Sites source and public website redirects are distinct; an icon on a redirect alone does not fix its destination.

## Safe refresh

Open the actual app URL in Safari, reload, then Share → Add to Home Screen and check the logo preview. Add alongside the existing shortcut first. Keep the original installed web app until records have been exported/backed up and verified in the new installation. Installed web apps can have separate storage. Do not clear Safari website data, reset, or uninstall an app just to refresh its icon. Icon updates do not transfer local records. Use normal owner sign-in for private apps.

AutoDS and eBay sites, app data, credentials, access policies and existing native download bytes were not changed.

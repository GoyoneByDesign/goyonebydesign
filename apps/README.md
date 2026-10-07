# Application catalog

The public catalog lives at https://www.goyonebydesign.com/apps/. The catalog includes BOARDROOM in its source data, honors explicit per-download URLs, and preserves legacy app-name anchors. Edit catalog.json, then run `node scripts/build-apps.mjs` from the repository root. The generated HTML works without JavaScript; JavaScript adds filters and preview dialogs. Run `node --test scripts/test-apps-ui.mjs` for source-level filter/search/preview checks; these do not replace visual browser QA. Serve the root directory to preview.

## Downloads

Installer binaries live in the public website repository’s GitHub Releases or the existing versioned website download folder, not private-source URLs or expiring Actions artifacts. The September 26, 2026 prerelease archives StatusPing Android 0.1.0 and legacy SightSync Windows 0.1.0. SHA256SUMS.txt is included. Source repositories retain their existing visibility.

The three retained test downloads were fetched anonymously and SHA-256 checked on October 6, 2026. Checksums, byte sizes and verification dates are recorded per download in catalog.json. The old SavvyKin v0.36 package remains explicitly labeled as a legacy test within the renamed JustMyPick card; it does not contain the v0.37 source changes. Current View4Real v0.2.1 source is separate from the legacy SightSync v0.1.0 Windows package. No new native package was built by this catalog update.

Only add a platform to an app's downloads object after an actual installer is uploaded and its public URL and checksum are verified. Leave missing platforms absent: the generated button will be truly disabled. Browser/PWA links are separate from native downloads. iOS requires a supported App Store/TestFlight distribution link; do not present an APK, source archive, or unsigned IPA as an iPhone installer.

## Images

MAX-ZETA, The Commissary, SavvyKin and StatusPing use Michael's supplied artwork. MAX-ALPHA and View4Real use existing project assets. Questrix and StockPilot use simple letter project marks, not newly claimed official logos.

Screenshots show real local interfaces: StatusPing, MAX-ALPHA, Questrix's seeded mock-feedback dashboard, StockPilot's seeded demo dashboard, and The Commissary's login with a synthetic email and empty password. View4Real uses its existing product-page illustration, explicitly labeled rather than described as a native app screenshot. MAX-ZETA’s private workspace and JustMyPick’s unavailable runtime use branded artwork, not fabricated screens. JustMyPick’s Happy Bag SVG is copied from the current iOS source artwork; BOARDROOM uses the established Goyone By Design logo.

StatusPing screenshot photography: Vidal Balielo Jr., https://www.pexels.com/photo/photo-of-family-walking-on-park-2880897/, Pexels license https://www.pexels.com/license/. Full source credit is also kept in StatusPing/docs/PHOTO_CREDITS.md.

## Retention

Keep current installers in GitHub Releases and locally. Remove superseded temporary extraction folders, duplicate build archives, and generated caches after verifying the current replacement. Preserve original supplied archives, private backups, source, signing material, and existing releases unless their replacement and purpose are clear. Never delete unrelated downloads based only on age.

## Installation and maintenance

MAX-ALPHA links to `/apps/install.html` for separate web installation and updates. MyThang was removed from the public catalog on October 5, 2026; its source project and existing artwork are preserved. JustMyPick, formerly SavvyKin, has new Android/iOS source work but no newly verified installer. The preserved SavvyKin v0.36 legacy test APK needs a local test backend for online features and is not a production release. See [MAINTENANCE.md](MAINTENANCE.md) for bounded release-artifact cleanup.

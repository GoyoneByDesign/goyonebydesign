# Application catalog

The public catalog lives at https://www.goyonebydesign.com/apps/. Edit catalog.json, then run `node scripts/build-apps.mjs` from the repository root. The generated HTML works without JavaScript; JavaScript adds filters and preview dialogs. Serve the root directory to preview.

## Downloads

Installer binaries live in the public website repository's GitHub Releases, not private-source URLs or expiring Actions artifacts. The September 26, 2026 prerelease archives StatusPing Android 0.1.0 and legacy SightSync Windows 0.1.0. SHA256SUMS.txt is included. Source repositories retain their existing visibility.

Only add a platform to an app's downloads object after an actual installer is uploaded and its public URL and checksum are verified. Leave missing platforms absent: the generated button will be truly disabled. Browser/PWA links are separate from native downloads. iOS requires a supported App Store/TestFlight distribution link; do not present an APK, source archive, or unsigned IPA as an iPhone installer.

## Images

MAX-ZETA, The Commissary, SavvyKin and StatusPing use Michael's supplied artwork. MAX-ALPHA and View4Real use existing project assets. Questrix and StockPilot use simple letter project marks, not newly claimed official logos.

Screenshots show real local interfaces: StatusPing, MAX-ALPHA, Questrix's seeded mock-feedback dashboard, StockPilot's seeded demo dashboard, and The Commissary's login with a synthetic email and empty password. View4Real uses its existing product-page illustration, explicitly labeled rather than described as a native app screenshot. MAX-ZETA's private workspace and SavvyKin's unavailable runtime use branded artwork, not fabricated screens.

StatusPing screenshot photography: Vidal Balielo Jr., https://www.pexels.com/photo/photo-of-family-walking-on-park-2880897/, Pexels license https://www.pexels.com/license/. Full source credit is also kept in StatusPing/docs/PHOTO_CREDITS.md.

## Retention

Keep current installers in GitHub Releases and locally. Remove superseded temporary extraction folders, duplicate build archives, and generated caches after verifying the current replacement. Preserve original supplied archives, private backups, source, signing material, and existing releases unless their replacement and purpose are clear. Never delete unrelated downloads based only on age.

## Installation and maintenance

MAX-ALPHA links to `/apps/install.html` for separate web installation and updates. MyThang is included with unavailable native installers. SAVVYKIN has existing local Android source and a test APK, but its local backend configuration is not a public-ready release. See [MAINTENANCE.md](MAINTENANCE.md) for bounded release-artifact cleanup.

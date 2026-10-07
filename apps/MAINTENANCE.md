# Release storage and bounded cleanup

The source of truth is `apps/catalog.json`. Run `node scripts/build-apps.mjs` and `node scripts/check-apps.mjs` after edits. Preserve approved logos, real screenshot captions, native versus web labels, and private workspace access controls. Platform links must identify an actual public installer; missing platforms remain disabled. Installation instructions live at `/apps/install.html`.

Prepared catalog: nine app records including BOARDROOM, three verified existing test downloads (StatusPing v0.1.0 Android, legacy SightSync v0.1.0 Windows, and legacy SavvyKin v0.36 Android), MAX-ALPHA web installation, and private MAX-ZETA/BOARDROOM launch links. JustMyPick is the confirmed replacement display name for SavvyKin; its new v0.37 source work is not represented as an installer. MyThang remains removed at the owner’s prior request; its source and artwork are preserved. Physical phone/Windows installation remains a separate validation step.

The generator now retains the complete nine-app inventory, explicit download URLs, legacy package labeling and per-download integrity metadata. `check-apps.mjs` validates local package bytes and hashes, exact rendered destinations, native availability and the requested MyThang removal. Publication is a separate authorized step; local preparation alone does not change the live site.

## Save a release

1. Verify package identity, version, signing, permissions, public backend configuration and absence of secrets/user data. Test the target platform and disclose test-build limitations.
2. Use immutable, versioned GitHub Release assets for public installer downloads, as established by the existing catalog. Verify public download bytes and SHA-256 before enabling a platform button. Record updates in `downloads/SHA256SUMS.txt` and release notes.
3. Keep editable source/Git history locally and in the established GitHub repository. Save a private Drive backup of the reviewed source/release archive. Never include credentials, customer records, personal app state, or model caches.
4. Publish without force-pushing; verify the live catalog and download hashes. Preserve concurrent edits and retain the current plus one previous verified release for rollback.

## Remove obsolete generated files

For site-local artifacts, register exact paths and hashes in `apps/release-history.json`, newest first for each app/platform. Keep historical records after deleting files. New managed local paths must be beneath `downloads/releases/`.

Run `python3 scripts/clean-app-releases.py` to preview. After release and backup verification, review the plan and run with `--apply` to delete only the qualified artifacts. Run `python3 scripts/test-release-cleanup.py` when modifying the tool.

The script keeps the two newest registered releases per app/platform, files linked by the catalog, every unregistered file, and legacy paths outside `downloads/releases/`. Changed hashes, duplicate records, path traversal and symlinks stop the operation. Source, user data, signing keys, personal Downloads and Git history are outside its scope. It does not delete GitHub Release assets or Drive backups; those need separate inventory and replacement verification.

This is a release-time workflow, not a background deletion service. Updating the catalog does not automatically replace native applications installed on a phone. MAX-ALPHA already handles its own web-interface updates. The initial cleanup inventory has no obsolete files, so no application artifacts were deleted.

# MAX-ALPHA rename compatibility

October 3, 2026

The active product, titles, install manifests, exported filenames, documentation, tests, catalog and canonical website path now use MAX-ALPHA. The website baseline remains the 1.16 series; the dedicated app repository remains the 1.18 series. No feature branch was substituted.

## Intentional compatibility names

- `/max-g/` contains only legacy link/install migration files. The stable web manifest ID also remains `/max-g/` so existing installs can recognize the renamed product. The canonical website is `/max-alpha/`.
- Existing IndexedDB name `maxg-personal-v1`, browser storage keys, native bridge names and internal events/CSS identifiers remain unchanged to preserve personal data, saved connections and installed companion compatibility. These are not visible product names or active file names.
- The existing Cloudflare Worker service `max-g-search`, its verified workers.dev endpoint, support-token environment name and existing allowed legacy origin remain untouched. Renaming a live cloud resource or changing credentials is a separate deployment; this release does neither.
- Git commit history and earlier release records are preserved. The GitHub repository is GoyoneByDesign/MAX-ALPHA (stable repository ID 1389535974), renamed by the owner and verified on October 3.
- Offline computer folders and installed native binaries cannot be renamed from this web release. Existing Home Screen labels/icons may need the browser/OS to refresh or a new shortcut; the website cannot force an OS label update.

The centered A glows for real processing/speaking activity, with a gentle pulse and a static glow under reduced motion. Idle is unlit. Occasional eye blinks stop when reduced motion is selected. No API fees, new provider setup or changes to MAX-ZETA are included.

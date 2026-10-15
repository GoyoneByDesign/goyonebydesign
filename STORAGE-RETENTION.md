# Storage retention for all apps

Updated October 15, 2026 (America/New_York). This is source maintenance guidance, not a new app release or installer.

## Safe storage retention across all apps

Michael instructed on October 15, 2026: remove old copies from GitHub and Google Drive when doing so does not affect app functions or features. This supersedes blanket instructions to preserve every old backup.

- Keep current editable source and required runtime assets, lockfiles, build inputs, deployment dependencies, release history, and unique unfinished-work evidence.
- Before pruning, verify the latest complete private backup and at least one useful prior recovery version per app/platform. Retain distinct baselines or irreplaceable source/evidence when necessary. Age or similar filenames alone are insufficient evidence.
- After a new backup passes byte/hash and privacy checks, move superseded private backup archives to Drive Trash. Keep a small dated inventory/receipt instead of duplicating a full source ZIP for documentation-only checkpoints. Preserve meaningful checkpoint work.
- Preserve all existing public APKs/installers, referenced downloads and Commissary Excel forms. Do not delete active assets, data, branches, repositories, or required source to save space.
- GitHub Actions artifacts from completed older runs may be removed after confirming they are superseded and keeping at least two recent successful artifacts of each app/platform/type. Preserve test evidence and release assets. Never remove an artifact used by an active run.
- Do not rewrite Git history, force-push, or promise that deleting tracked files in a new commit reclaims Git history storage. Prefer trimming redundant build artifacts and backups.
- Use reversible cleanup where available; record exact IDs, sizes, retained recovery copies, verification and Eastern timestamp. Verify the result and linked/live functionality. Drive Trash still counts toward storage until permanently removed.
- Apply this retention review during normal authorized app backup/publishing work; no new recurring automation is implied.


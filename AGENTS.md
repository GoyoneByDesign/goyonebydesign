# Project instructions

## Storage retention across all apps

Follow `STORAGE-RETENTION.md` for Michael's October 15, 2026 instruction to remove superseded copies safely. Keep source, required assets, public downloads, Excel forms, release history, unique evidence, current backups and a useful rollback. This supersedes blanket retention of every backup. No Git history rewrite or force push is authorized.

## Work across coding assistants

This project must remain editable with Antigravity, ChatGPT/Codex, Gemini, and ordinary development tools. The repository files are the shared project memory.

- Start by reading `README.md`, `AI_HANDOFF.md`, and applicable nested instructions. Use the existing source and architecture.
- Inspect `git status`, branch, origin, and recent commits before editing. Fetch origin when authenticated; pull with `--ff-only` only when the working tree is clean. Preserve uncommitted and divergent work.
- Keep editable source, dependency manifests/lockfiles, setup instructions, and useful verification commands in the repository. Document platform-specific prerequisites and external services.
- Keep real credentials, private app/user data, local databases, generated builds, and caches out of commits. Preserve existing exclusions. Configuration examples must contain placeholders.
- Run checks appropriate to the change. Report actual results, skipped checks, and environment limitations; never claim an app runs on a platform that was not tested.
- Update `AI_HANDOFF.md` after substantial work with the date, completed changes, checks/results, known blockers, and next steps. Keep decisions in files rather than only in chat.
- Save changes locally, inspect the intended diff, commit, and push to the established GitHub repository. Verify the local branch and the corresponding remote branch have the same commit ID. If access, network, or conflicts block synchronization, clearly report it.
- Never force-push, discard someone else's edits, or automatically overwrite divergent work. Use separate branches/checkouts for simultaneous assistants.
- On another computer, pull before work and push afterward. Scheduled checks cannot synchronize a sleeping or offline machine.
- These files do not grant repository access, deploy the application, or transfer chat history. Honor the user's task scope and each tool's access permissions.

## Visible release history and safe storage

- Every app/program update must record its version, build number, date/time, clear change descriptions, source references when relevant, and actual validation status. Store timezone-aware timestamps; display America/New_York (Eastern, including daylight saving). Preserve older entries and mark unknown historical values as not recorded.
- Maintain a visible Version & update history link in the app and a matching entry in the GoyoneByDesign portal history. Keep source-only changes, experimental packages, tested builds and published releases distinct. Synchronize release metadata and integrity manifests; do not imply an old installer includes new source changes.
- Apply researched improvements only after compatibility checks and relevant tests. View4Real research cannot establish clinical benefit or replace prescribed eyewear.
- Michael authorizes private Google Drive app backups and suitable bulky storage files. Keep required runtime assets, source, build inputs and deployment dependencies intact. Inspect references, verify uploaded bytes and privacy, and coordinate the storage audit before any move/cleanup. Do not rewrite Git history or remove required assets to save space.

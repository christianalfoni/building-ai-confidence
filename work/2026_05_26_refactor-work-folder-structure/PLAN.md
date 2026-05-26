# Refactor: Work Folder Structure

## Summary
Replace the flat `plans/` folder with a `work/` folder where each branch gets its own subdirectory, prefixed with `YYYY_MM_DD_<branch-name>`. Plans and screenshots live inside the branch folder, keeping all work for a branch in one place.

## Considerations
- `YYYY_MM_DD` prefix chosen over `DD_MM_YYYY` so folders sort correctly by date lexicographically.
- The branch name doubles as the folder identifier — no separate naming step needed.
- The screenshot script detects the current git branch at runtime and resolves the correct `work/` subfolder automatically, creating it if absent.
- Existing `plans/` files have no recoverable branch association, so they are deleted rather than migrated.
- `screenshots/` at the project root is rendered obsolete by the per-branch `screenshots/` subfolder; the ephemeral root folder can simply go away.

## Tasks
- [x] Delete `plans/` directory and its contents
- [x] Rewrite `scripts/list-recent-plans` → `scripts/list-recent-work` to scan `work/*/` folders by date prefix
- [x] Update `scripts/screenshot` to resolve the current branch's `work/` subfolder and save screenshots there
- [x] Update `workflows/PLAN.md` — new plan path, uppercase `PLAN.md` filename
- [x] Update `workflows/IMPLEMENT.md` — update path references
- [x] Update `workflows/UI.md` — update screenshot path references
- [x] Update `workflows/PR.md` — update screenshot path references
- [x] Update `AGENTS.md` — project structure doc, script table, and workflow descriptions
- [x] Remove the root `screenshots/` directory from `.gitignore` (if present) and add `work/*/screenshots/` instead
- [x] Update `workflows/PR.md` — add a Work Session section to the PR body template pointing to the branch's work folder

## Report

All tasks completed. The `plans/` folder and its 8 files were deleted. `scripts/list-recent-plans` was replaced with `scripts/list-recent-work`, which scans `work/*/` directories by their `YYYY_MM_DD` prefix and annotates entries that contain a `PLAN.md`. `scripts/screenshot` now detects the current branch via `git branch --show-current`, finds the matching `work/` subfolder, and saves screenshots to `work/<folder>/screenshots/` — creating the folder if needed. All workflow docs and `AGENTS.md` were updated to reference the new paths. `.gitignore` was updated from `screenshots/` to `work/*/screenshots/`. This plan itself was the first file written using the new structure.

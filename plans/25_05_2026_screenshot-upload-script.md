# Screenshot Upload Script & PR Visual Documentation

## Summary

Create a `scripts/upload-screenshot` script that uploads a local screenshot PNG to a dedicated persistent GitHub release used as an asset store, then prints the resulting `browser_download_url`. Update agent instructions to encourage before/after screenshots as part of UI work and PR submission.

## Considerations

**Asset storage — dedicated release:** A single release tagged `screenshot-assets` acts as a permanent CDN dump. `gh release upload --clobber` overwrites assets of the same name, so screenshots stay up-to-date without accumulating stale files. The release is created once as part of setup and the script assumes it exists.

**Naming:** The script uses the filename as-is (e.g. `desktop-App-withTodos.png`). Because `--clobber` overwrites, the URL is stable across re-uploads, which means the same URL can be referenced in a PR body and will always show the latest version.

**Ruled out — per-PR prereleases:** Creates cleanup overhead (must delete after merge). A single shared release is simpler.

**Ruled out — committing screenshots to the branch:** Adds binary files to git history and requires cleanup on merge.

## Tasks

- [x] Create the `screenshot-assets` GitHub release on the repo (a permanent prerelease used solely as an asset store)
- [x] Create `scripts/upload-screenshot` — accepts a path to a PNG, uploads to the `screenshot-assets` release via `gh release upload --clobber`, and prints the `browser_download_url`
- [x] Update `workflows/UI.md` — before making visual changes, take a "before" screenshot; after changes, take an "after" screenshot. Note that `upload-screenshot` can be used to get a URL for PR inclusion.
- [x] Update `workflows/PR.md` — when the change includes UI work, upload before/after screenshots with `upload-screenshot` and embed them in the `Current behavior` / `New behavior` sections in place of or alongside ASCII diagrams
- [x] Update `AGENTS.md` scripts table — add `screenshot` and `upload-screenshot` entries

## Report

All 5 tasks completed. The `screenshot-assets` prerelease was created at `https://github.com/christianalfoni/building-ai-confidence/releases/tag/screenshot-assets`. `scripts/upload-screenshot` uploads a PNG via `gh release upload --clobber` and prints the stable `browser_download_url` — verified with a live upload of `desktop-App-withTodos.png`. `workflows/UI.md` now instructs the agent to capture before/after screenshots on every UI iteration. `workflows/PR.md` instructs the agent to upload screenshots and embed them as inline images in the `Current behavior` / `New behavior` sections for UI changes. `AGENTS.md` scripts table now lists both `screenshot` and `upload-screenshot`.

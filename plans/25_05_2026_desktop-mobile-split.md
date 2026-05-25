# Desktop / Mobile Split

## Summary

Split the app into two separate platform trees — `src/desktop/` and `src/mobile/` — each with its own `components/` and `ui-components/`. Device detection runs once at startup in `main.tsx` using `window.matchMedia('(pointer: coarse)')`, and the appropriate root component is loaded via `React.lazy()` + `Suspense`. Shared infrastructure (state, contexts, services) stays at the top level.

## Considerations

**Detection signal:** `pointer: coarse` detects touch-first devices without user-agent parsing. It is evaluated synchronously before render so there is no flash of wrong layout. Hybrid devices (e.g. Surface in tablet mode) may be misidentified, but this is acceptable for now.

**Lazy loading:** `React.lazy()` splits each platform tree into its own JS chunk. The initial bundle only contains `main.tsx` and shared infrastructure; the platform chunk loads on first render. This adds one network round-trip on cold load, acceptable for an app (not a public website).

**Shared vs. platform-specific ui-components:** The existing `src/ui-components/` primitives (Button, Input, Checkbox, IconButton) are moved into the platform folders rather than kept shared. The whole point of the split is that even generic controls will differ between platforms (touch targets, interaction patterns), so starting them as separate copies is correct.

**Ruled out — shared ui-components layer:** Keeping a `src/ui-components/` shared layer would create pressure to design for both platforms simultaneously, defeating the purpose of the split.

**Ruled out — runtime media-query listener:** Reacting to viewport changes at runtime adds complexity and edge cases. Platform is treated as a startup decision.

## Tasks

- [x] Create `src/desktop/` and `src/mobile/` directory scaffolding
- [x] Move `src/components/App.tsx` → `src/desktop/components/App.tsx` (desktop baseline)
- [x] Copy `src/components/App.tsx` → `src/mobile/components/App.tsx` (mobile baseline)
- [x] Move `src/ui-components/*` into `src/desktop/ui-components/` and copy into `src/mobile/ui-components/`
- [x] Update all import paths inside the desktop and mobile component files
- [x] Delete the old `src/components/` and `src/ui-components/` directories
- [x] Create `src/desktop/App.tsx` and `src/mobile/App.tsx` as lazy-loadable entry points
- [x] Update `src/main.tsx` to detect platform and lazy-load the correct entry point
- [x] Verify the app still renders correctly (run dev server, check both paths work)
- [x] Update `AGENTS.md` — replace `components/` and `ui-components/` in the project structure with the new `desktop/` and `mobile/` trees; update the four-layer description to explain that `components` and `ui-components` now live under each platform folder; add a note on the lazy-load detection strategy
- [x] Update `workflows/UI.md` — replace the story path reference (`src/components/`) with a note that stories live under the relevant platform folder (`src/desktop/components/` or `src/mobile/components/`)
- [x] Update `workflows/IMPLEMENT.md` — update the layer convention note to reflect that `components` and `ui-components` are now platform-scoped under `desktop/` or `mobile/`

## Report

All 12 tasks completed. The old `src/components/` and `src/ui-components/` directories were deleted and replaced with `src/desktop/` and `src/mobile/` platform trees, each containing their own `components/` and `ui-components/`. `main.tsx` now detects `pointer: coarse` once at startup and lazy-loads the correct platform chunk via `React.lazy()` + `Suspense`. Stories and tests were migrated to `src/desktop/components/` (the mobile tree starts without tests). All 12 tests passed (`npm test -- --run`). `AGENTS.md`, `workflows/UI.md`, and `workflows/IMPLEMENT.md` were updated to document the new architecture for future sessions.

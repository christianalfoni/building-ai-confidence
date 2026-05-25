# UI Iteration Workflow

## Summary

Introduce a lightweight "stories" pattern and a `ui` workflow for iterating on the visual appearance of components. Stories are the single source of truth for component state setup — each returns `{ element, appState }`. Tests import stories instead of duplicating setup, and a new `scripts/screenshot` script uses Playwright to render stories in a real browser via the Vite dev server and save a PNG. The `ui` workflow (distinct from the existing `ux` workflow) guides the agent through a visual iteration loop: make a code change, take a screenshot, show it to the user, refine. The `ux` workflow handles interaction design; the `ui` workflow handles visual polish and component appearance.

## Considerations

**Stories as JSX factories vs. Storybook**
Storybook was ruled out — it is heavy tooling with its own build pipeline. We want the lightest possible layer that reuses existing `createAppState`/`AppContext` infrastructure.

**Test refactor: `renderWithApp(ui, appState)` → `render(story.element)`**
The current `renderWithApp` helper hides context wiring inside a function. Stories make context wiring explicit in the story file itself, so `renderWithApp` is no longer needed. Tests that currently access `appState` directly (for state assertions) can do so via `story.appState`. This is a small breaking change to existing tests but results in less indirection.

**Screenshot entry point: separate HTML vs. query param on main app**
A dedicated `stories.html` entry point (served by Vite alongside `index.html`) keeps story rendering completely isolated from the production app. The page reads `?component=App&story=withTodos` from the URL, dynamically imports the matching story file, and mounts the returned element. This avoids polluting the main app bundle.

**Playwright: installed as a project dep vs. npx**
Installing `playwright` (or `@playwright/test`) as a dev dependency is more reliable in scripts than `npx`. Only the Chromium browser binary is needed.

**Dev server lifecycle in the script**
The script starts the Vite dev server, waits for it to be ready, takes the screenshot, then kills the server. This keeps the script self-contained with no assumption about a running server, at the cost of ~2–3 s startup time per invocation.

## Tasks

- [x] Install `playwright` as a dev dependency and download the Chromium browser binary
- [x] Create `stories.html` + `src/stories-entry.tsx` — the Vite entry point that reads URL params and dynamically imports and mounts a story
- [x] Register `stories.html` as a second entry point in `vite.config.ts`
- [x] Create `src/components/App.stories.tsx` with stories `empty`, `withTodos`, and `withCompletedTodo` that each return `{ element, appState }`
- [x] Refactor `src/components/App.test.tsx` to import from `App.stories.tsx` and use `render(story.element)` — remove `renderWithApp` from the test
- [x] Remove `renderWithApp` from `src/test-utils.tsx` (no longer needed)
- [x] Create `scripts/screenshot` — a Node script that starts the Vite dev server, launches Playwright Chromium, navigates to the story URL, takes a screenshot, saves it to `screenshots/<Component>-<story>.png`, and prints the path
- [x] Verify the full workflow end-to-end: run `./scripts/screenshot App withTodos` and confirm the PNG is saved and readable
- [x] Create `workflows/UI.md` defining the UI iteration workflow and reference it in `AGENTS.md`

## Report

All 9 tasks completed. `npm test -- --run` passes with 12 tests across 2 files.

**What was done:**
- Installed `playwright` and downloaded the Chromium binary.
- Added `stories.html` + `src/stories-entry.tsx` as a second Vite entry point that dynamically imports and mounts any named story via URL params (`?component=App&story=withTodos`).
- Created `src/components/App.stories.tsx` with three stories (`empty`, `withTodos`, `withCompletedTodo`), each returning `{ element, appState }`.
- Refactored `App.test.tsx` to import from stories — state setup is now defined once and shared between tests and screenshots.
- Removed `renderWithApp` from `test-utils.tsx`; tests now call `render(story.element)` directly.
- Created `scripts/screenshot` — a self-contained Node script that starts the Vite dev server on port 5199, takes a Playwright screenshot, saves it to `screenshots/<Component>-<story>.png`, and prints the path.
- Added `screenshots/` to `.gitignore`.
- Created `workflows/UI.md` defining the visual iteration loop and updated `AGENTS.md` to reference it alongside the existing workflows.

**Deviations:** None. The ReactX devtools widget appears in the bottom-right corner of screenshots (it is injected by the `reactx/vite-plugin` in dev mode). This is cosmetic and does not affect the workflow.

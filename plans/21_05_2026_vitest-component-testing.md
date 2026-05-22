# Vitest Component Testing Setup

## Summary

Set up Vitest with React Testing Library so components can be tested in isolation. Tests instantiate `AppState` with mocked services, optionally pre-mutate state, wrap the component under test in `AppContext`, and assert on rendered output or side-effects after user interaction.

## Considerations

**Test environment:** jsdom is the standard DOM emulator for Vitest; it's lightweight and works well with React Testing Library. The alternative (happy-dom) is faster but has occasional compatibility gaps — jsdom is the safer default.

**Test utilities:** Rather than repeating the context wrapper in every test, a shared `renderWithApp` helper in `src/test-utils.tsx` accepts an `AppState` instance and wraps the component in `AppContext.Provider`. This keeps tests concise and consistent.

**Mocked services:** `Services` is currently an empty interface, so the mock is just `{}`. As services grow, tests pass only what the state under test uses — TypeScript will catch omissions.

**reactx vite plugin:** The `reactx()` vite plugin transforms class fields into observables at build time. Vitest re-uses the vite config, so the plugin runs in tests too — no special handling needed.

**File convention:** Test files live next to the file they test, named `*.test.tsx` (or `.ts` for non-JSX).

**IMPLEMENT.md update:** Add a "Testing" section explaining the pattern and the `npm run test` command.

## Tasks

- [x] Install vitest, jsdom, @testing-library/react, and @testing-library/user-event as dev dependencies
- [x] Add `test` script and vitest config block to `vite.config.ts` (environment: jsdom, globals: true)
- [x] Add `"types": ["vitest/globals"]` to `tsconfig.app.json` so `describe`/`it`/`expect` are typed without imports
- [x] Create `src/test-utils.tsx` exporting a `renderWithApp(ui, appState)` helper
- [x] Update `workflows/IMPLEMENT.md` with a Testing section (pattern, file naming, bash command)

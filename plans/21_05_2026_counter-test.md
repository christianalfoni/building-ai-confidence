# Counter Test

## Summary

Write tests for the counter feature covering both the `AppState` class logic and the `App` component UI. State tests verify `increment` and `decrement` mutate `count` correctly. Component tests verify the rendered count updates and the buttons trigger the right mutations.

## Considerations

**What to test:** Two natural test targets exist — the state class in isolation (pure unit tests, no DOM) and the component (integration via React Testing Library). Both are worth covering: state tests are fast and precise; component tests catch wiring mistakes between state and UI.

**State tests vs component tests:** State tests call methods directly and assert on the class field — no rendering needed, no `test-utils` required. Component tests use `renderWithApp` from `src/test-utils.tsx`, pre-set state, and simulate clicks with `@testing-library/user-event`.

**File placement:** Tests live next to the file they test (`*.test.ts` / `*.test.tsx`), following the convention established in the Vitest setup plan.

**Scope:** Four cases cover the counter fully:
- `AppState`: `increment` increases count, `decrement` decreases count
- `App`: renders initial count, clicking `+` increments the displayed value, clicking `−` decrements it

## Tasks

- [x] Create `src/state/AppState.test.ts` — unit tests for `increment` and `decrement`
- [x] Create `src/components/App.test.tsx` — component tests for rendered count and button interactions

## Report

Both test files created and all 5 tests pass (`npm test -- --run`).

One deviation from the plan: `test-utils.tsx` was missing a `reactive()` call when constructing `AppState`. Without it, the component never became observable and clicks didn't trigger re-renders. Fixed by importing `reactive` from `reactx` and wrapping the constructor call in `createAppState`.

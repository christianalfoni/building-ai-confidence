---
description: Execute an approved plan from the work/ folder, task by task, then hand off to /pr.
---

# Implement Workflow

Execute an approved plan from the `work/` folder.

## Steps

1. Confirm with the user which plan to implement.
2. Read `work/YYYY_MM_DD_<branch-name>/PLAN.md` and identify the first unchecked task.
3. Implement the task, following the architecture in `CLAUDE.md` and style guide in `DESIGN.md`.
4. Check off the completed task in the plan file (`- [ ]` → `- [x]`).
5. Repeat from step 2 until all tasks are checked off.
6. Validate the implementation:
   - Run `npm run lint` and fix any errors before continuing.
   - Run `npm test -- --run` and fix any failures before continuing.
7. Write a brief report under the `## Report` section of the plan file summarising what was done, any deviations from the plan, and the outcomes of lint and tests.
8. Tell the user that implementation is complete and paste the report.
9. Always conclude by running the `/pr` skill to commit and submit the changes as a pull request. Do not wait for the user to ask.

## Rules

- Implement one task at a time. Do not skip ahead.
- If a task turns out to require scope changes, update the plan and confirm with the user before continuing.
- Follow the layer conventions from `CLAUDE.md`: `services → state → contexts → components → ui-components`. Note that `components` and `ui-components` are platform-scoped — they live under `src/desktop/` or `src/mobile/`, not at the top level.
- Follow the style guide in `DESIGN.md` for all UI work.

## Testing

Test files live next to the file they test, named `*.test.tsx` (or `.ts` for non-JSX files).

**Pattern for component tests:**

1. Import `createAppState` and `renderWithApp` from `src/test-utils`.
2. Create an `AppState` with mocked services using `createAppState({ ...only what this test needs... })`. `createAppState` wraps the instance with `reactive()` from `reactx` so that state mutations trigger component re-renders — this matches how `main.tsx` creates the live instance.
3. Optionally pre-mutate state before rendering (e.g. `appState.increment()`).
4. Call `renderWithApp(<ComponentUnderTest />, appState)` — this wraps the component in `AppContext.Provider`.
5. Interact via `@testing-library/user-event` and assert with standard `expect` matchers. DOM matchers like `toBeInTheDocument` are available globally via `@testing-library/jest-dom` (imported in `src/test-setup.ts`).

```tsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAppState, renderWithApp } from "../test-utils";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("increments the count", async () => {
    const appState = createAppState();
    renderWithApp(<Counter />, appState);

    await userEvent.click(screen.getByRole("button", { name: /increment/i }));

    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
```

**Verify tests pass:**

```bash
npm test
```

Run in watch mode during development (`npm test` starts vitest in watch mode by default). For a single CI-style run: `npm test -- --run`.

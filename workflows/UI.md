# UI Iteration Workflow

Iterate on the visual appearance of a component using stories and screenshots. Use this after code has been written — when the goal is to refine how something looks, not to define what it does.

This workflow is distinct from the **ux** workflow, which defines interaction design and states before implementation. The **ui** workflow polishes appearance after implementation.

## When to use

- The user wants to adjust the visual appearance of a component (layout, spacing, colour, typography).
- The user wants to see how a component looks in a specific state before deciding on further changes.
- The user says "show me what it looks like" or "can we tweak the styling".

## Prerequisites

- The component must have a `*.stories.tsx` file next to it in `src/components/`.
- Each story must export a named function returning `{ element, appState }`.

## Story format

```tsx
// src/components/MyComponent.stories.tsx
import { AppContext } from "../contexts/AppContext";
import { createAppState } from "../test-utils";
import { MyComponent } from "./MyComponent";

export function someState() {
  const appState = createAppState();
  // mutate appState to set up the desired state
  return {
    element: (
      <AppContext.Provider value={appState}>
        <MyComponent />
      </AppContext.Provider>
    ),
    appState,
  };
}
```

Stories are also imported by tests — they are the single source of truth for component state setup. When adding a new story, verify that `npm test -- --run` still passes.

## Steps

1. Identify which story represents the state to iterate on, or add a new story if the desired state does not exist yet.
2. Make the code change (component, styles, tokens).
3. Run the screenshot script:
   ```bash
   ./scripts/screenshot <Component> <storyName>
   ```
   Example: `./scripts/screenshot App withTodos`
4. Read the saved PNG and display it to the user:
   ```
   screenshots/<Component>-<storyName>.png
   ```
5. Ask the user if the result looks right or if further changes are needed.
6. Repeat from step 2 until the user approves.
7. Run `npm test -- --run` to confirm no regressions before handing off to the **pr** workflow.

## Rules

- Never mark UI work as done without showing a screenshot to the user.
- Do not add stories that are only used for screenshots — stories must also be usable in tests.
- Follow the style guide in `DESIGN.md` for all visual changes.
- The `screenshots/` directory is ephemeral — do not commit its contents.

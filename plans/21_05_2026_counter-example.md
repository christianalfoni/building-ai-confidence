# Counter Example

## Summary
Add a simple counter to the app that demonstrates the services → state → context → component data flow. A count value lives in `AppState`, mutations are methods on that class, and the `App` component reads and calls them through the `useApp()` hook.

## Considerations
- **Where to put counter state:** `AppState` already exists and is the natural home for a single-feature example. Creating a separate `CounterState` class would be correct at scale but is over-engineering here.
- **UI placement:** The existing `App` component is a stub (`<h1>Hello World</h1>`). Replacing its body with the counter keeps the example self-contained without adding new component files.
- **Styling:** Follow `DESIGN.md` conventions and use Tailwind utility classes already configured in the project.

## Tasks
- [x] Add `count` field and `increment` / `decrement` methods to `AppState`
- [x] Update `App` component to display the count and wire up the two buttons

# Button UI Component

## Summary
Extract the inline `<button>` elements from domain components into a reusable `<Button>` ui-component that encodes the design-system variants defined in `DESIGN.md`. This removes duplicated Tailwind class strings from domain components and gives a single place to evolve button styling.

## Considerations
- **Single component with a `variant` prop** (`primary` | `secondary`) vs. separate components (`PrimaryButton`, `SecondaryButton`). A single component with a variant prop is more conventional, easier to extend, and matches DESIGN.md's two defined styles.
- **Secondary variant included now vs. later.** DESIGN.md already specifies secondary styles and it costs nothing to add it alongside primary. Leaving it out would mean revisiting this file immediately when a secondary button is needed.
- The component accepts all native `<button>` props via `ComponentProps<"button">` so callers never need workarounds for `onClick`, `disabled`, `type`, etc.

## Tasks
- [x] Create `src/ui-components/Button.tsx` with `primary` and `secondary` variants
- [x] Replace the two inline `<button>` elements in `src/components/App.tsx` with `<Button variant="primary">`

## Report
Created `src/ui-components/Button.tsx` with `primary` (default) and `secondary` variants, spreading `ComponentProps<"button">` for full native prop support. Replaced the two inline `<button>` elements in `App.tsx` with `<Button>` (variant defaults to primary, so no explicit prop needed). All 5 tests pass.
